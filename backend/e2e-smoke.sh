#!/usr/bin/env bash
# End-to-end smoke test for the Kokoro March API.
set -u
BASE=${BASE:-http://localhost:4000/api}
PASS=0; FAIL=0
check() { # check <name> <condition 0/1> [detail]
  if [ "$2" = "0" ]; then echo "  ✅ $1"; PASS=$((PASS+1)); else echo "  ❌ $1 — ${3:-}"; FAIL=$((FAIL+1)); fi
}
jget() { python3 -c "import sys,json;d=json.load(sys.stdin);print(eval('d'+\"$1\"))" 2>/dev/null; }

echo "── 1. Unauthorized access is rejected"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/users/me")
check "GET /users/me without token -> 401" "$([ "$code" = "401" ] && echo 0 || echo 1)" "got $code"

echo "── 2. Register user A (Nala)"
A=$(curl -s -X POST "$BASE/auth/register" -H 'Content-Type: application/json' -d '{
  "name":"Nala Test","email":"nala@example.com","password":"Password123",
  "dob":"1998-06-15","gender":"female","city":"Douala","country":"Cameroon"}')
A_TOKEN=$(echo "$A" | jget "['accessToken']")
check "User A got access token" "$([ -n "$A_TOKEN" ] && echo 0 || echo 1)" "$A"

echo "── 3. Register user B (Kofi)"
B=$(curl -s -X POST "$BASE/auth/register" -H 'Content-Type: application/json' -d '{
  "name":"Kofi Test","email":"kofi@example.com","password":"Password123",
  "dob":"1996-02-20","gender":"male","city":"Douala","country":"Cameroon"}')
B_TOKEN=$(echo "$B" | jget "['accessToken']")
check "User B got access token" "$([ -n "$B_TOKEN" ] && echo 0 || echo 1)" "$B"

echo "── 4. Under-18 registration rejected"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/auth/register" -H 'Content-Type: application/json' -d '{
  "name":"Young","email":"young@example.com","password":"Password123",
  "dob":"2015-01-01","gender":"female","city":"X","country":"Y"}')
check "Under 18 -> 400" "$([ "$code" = "400" ] && echo 0 || echo 1)" "got $code"

echo "── 5. Onboarding for A & B"
curl -s -X POST "$BASE/profiles/onboarding" -H "Authorization: Bearer $A_TOKEN" -H 'Content-Type: application/json' -d '{
  "bio":"Love music, travel and good food. Looking for something real.","intention":"long_term",
  "showMe":"male","ageMin":23,"ageMax":35,"maxDistanceKm":100,"mainPhotoUrl":"/media/avatars/amara@kokoro.test.svg",
  "interestIds":[]}' > /dev/null
curl -s -X POST "$BASE/profiles/onboarding" -H "Authorization: Bearer $B_TOKEN" -H 'Content-Type: application/json' -d '{
  "bio":"Engineer who loves football and afrobeats. Serious about connection.","intention":"long_term",
  "showMe":"female","ageMin":22,"ageMax":34,"maxDistanceKm":100,"mainPhotoUrl":"/media/avatars/kwame@kokoro.test.svg",
  "interestIds":[]}' > /dev/null
PROF=$(curl -s "$BASE/profiles/me" -H "Authorization: Bearer $A_TOKEN")
check "Onboarding completed flag" "$([ "$(echo "$PROF" | jget "['onboardingCompleted']")" = "True" ] && echo 0 || echo 1)" "$PROF"
COMPLETION=$(echo "$PROF" | jget "['completion']")
check "Profile completion >= 80 (got $COMPLETION)" "$([ "${COMPLETION:-0}" -ge 80 ] && echo 0 || echo 1)"

echo "── 6. Discovery works"
DISC=$(curl -s "$BASE/discover" -H "Authorization: Bearer $A_TOKEN")
COUNT=$(echo "$DISC" | jget "['total']")
check "Discovery returns candidates (count=$COUNT)" "$([ "${COUNT:-0}" -ge 5 ] && echo 0 || echo 1)" "$DISC"
B_UID=$(echo "$B" | jget "['user']['id']")
A_UID=$(echo "$A" | jget "['user']['id']")
INCONT=$(echo "$DISC" | grep -c "$B_UID")
check "User B appears in A's discovery (same city, reciprocal prefs)" "$([ "$INCONT" -ge 1 ] && echo 0 || echo 1)"

echo "── 7. Compatibility score is meaningful"
SCORE=$(echo "$DISC" | python3 -c "
import sys,json
d=json.load(sys.stdin)
b=[x for x in d['items'] if x['userId']=='$B_UID']
print(b[0]['compatibility'] if b else '')" 2>/dev/null)
check "Compatibility score exists for B (got $SCORE)" "$([ -n "$SCORE" ] && [ "$SCORE" -ge 0 ] 2>/dev/null && echo 0 || echo 1)"

echo "── 8. A likes B (no match yet)"
R=$(curl -s -X POST "$BASE/likes/$B_UID" -H "Authorization: Bearer $A_TOKEN")
check "No match until reciprocal like" "$([ "$(echo "$R" | jget "['matched']")" = "False" ] && echo 0 || echo 1)" "$R"

echo "── 9. B received a like notification"
NOTIF=$(curl -s "$BASE/notifications" -H "Authorization: Bearer $B_TOKEN")
check "B has a like notification" "$([ "$(echo "$NOTIF" | grep -c 'new like\|Super Liked')" -ge 1 ] && echo 0 || echo 1)" "$NOTIF"

echo "── 10. B likes A → MATCH"
R=$(curl -s -X POST "$BASE/likes/$A_UID" -H "Authorization: Bearer $B_TOKEN")
check "Match created on reciprocal like" "$([ "$(echo "$R" | jget "['matched']")" = "True" ] && echo 0 || echo 1)" "$R"
CONV=$(echo "$R" | jget "['match']['conversationId']")
check "Conversation created with match" "$([ -n "$CONV" ] && echo 0 || echo 1)"

echo "── 11. Both notified of the match"
NA=$(curl -s "$BASE/notifications" -H "Authorization: Bearer $A_TOKEN" | grep -c "It's a Match")
NB=$(curl -s "$BASE/notifications" -H "Authorization: Bearer $B_TOKEN" | grep -c "It's a Match")
check "Match notifications for A and B" "$([ "$NA" -ge 1 ] && [ "$NB" -ge 1 ] && echo 0 || echo 1)" "A=$NA B=$NB"

echo "── 12. Matches list"
M=$(curl -s "$BASE/matches" -H "Authorization: Bearer $A_TOKEN")
check "A sees the match in matches list" "$([ "$(echo "$M" | grep -c "$CONV")" -ge 1 ] && echo 0 || echo 1)"

echo "── 13. Conversation appears for both"
CA=$(curl -s "$BASE/conversations" -H "Authorization: Bearer $A_TOKEN" | grep -c "$CONV")
CB=$(curl -s "$BASE/conversations" -H "Authorization: Bearer $B_TOKEN" | grep -c "$CONV")
check "Conversation in both lists" "$([ "$CA" -ge 1 ] && [ "$CB" -ge 1 ] && echo 0 || echo 1)" "A=$CA B=$CB"

echo "── 14. Messages: A sends, B has unread, history persists"
curl -s -X POST "$BASE/conversations/$CONV/messages" -H "Authorization: Bearer $A_TOKEN" -H 'Content-Type: application/json' -d '{"body":"Hi Kofi! Loved your profile 😊"}' > /dev/null
curl -s -X POST "$BASE/conversations/$CONV/messages" -H "Authorization: Bearer $B_TOKEN" -H 'Content-Type: application/json' -d '{"body":"Hey Nala! Thanks, yours too 🌸"}' > /dev/null
HIST=$(curl -s "$BASE/conversations/$CONV/messages" -H "Authorization: Bearer $A_TOKEN")
MSGS=$(echo "$HIST" | jget "['total']")
check "Conversation history persisted (2 messages, got $MSGS)" "$([ "${MSGS:-0}" -eq 2 ] && echo 0 || echo 1)" "$HIST"

echo "── 15. Unread count tracked"
UNREAD=$(curl -s "$BASE/conversations" -H "Authorization: Bearer $B_TOKEN" | python3 -c "
import sys,json
d=json.load(sys.stdin)
c=[x for x in d if x['id']=='$CONV']
print(c[0]['unreadCount'] if c else -1)")
check "Unread counted for recipient (got $UNREAD)" "$([ "${UNREAD:-0}" -ge 1 ] && echo 0 || echo 1)"

echo "── 16. Read receipts clear unread"
curl -s -X POST "$BASE/conversations/$CONV/read" -H "Authorization: Bearer $B_TOKEN" > /dev/null
UNREAD=$(curl -s "$BASE/conversations" -H "Authorization: Bearer $B_TOKEN" | python3 -c "
import sys,json
d=json.load(sys.stdin)
c=[x for x in d if x['id']=='$CONV']
print(c[0]['unreadCount'] if c else -1)")
check "Unread cleared after read (got $UNREAD)" "$([ "$UNREAD" = "0" ] && echo 0 || echo 1)"

echo "── 17. Blocking stops interaction"
curl -s -X POST "$BASE/blocks/$A_UID" -H "Authorization: Bearer $B_TOKEN" > /dev/null
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/conversations/$CONV/messages" -H "Authorization: Bearer $A_TOKEN" -H 'Content-Type: application/json' -d '{"body":"blocked?"}')
check "Message blocked after block (403, got $code)" "$([ "$code" = "403" ] && echo 0 || echo 1)"
DISC_B=$(curl -s "$BASE/discover" -H "Authorization: Bearer $B_TOKEN" | grep -c "$A_UID")
check "Blocked user excluded from discovery" "$([ "$DISC_B" = "0" ] && echo 0 || echo 1)"
curl -s -X DELETE "$BASE/blocks/$A_UID" -H "Authorization: Bearer $B_TOKEN" > /dev/null

echo "── 18. Reporting works and auto-blocks"
curl -s -X POST "$BASE/reports" -H "Authorization: Bearer $A_TOKEN" -H 'Content-Type: application/json' -d "{\"reportedUserId\":\"$B_UID\",\"reason\":\"spam\",\"details\":\"smoke test\"}" > /dev/null
BL=$(curl -s "$BASE/blocks" -H "Authorization: Bearer $A_TOKEN" | grep -c "$B_UID")
check "Report auto-blocks reported user" "$([ "$BL" -ge 1 ] && echo 0 || echo 1)"

echo "── 19. Admin access control"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/admin/stats" -H "Authorization: Bearer $A_TOKEN")
check "Normal user cannot access admin (got $code)" "$([ "$code" = "403" ] && echo 0 || echo 1)"
ADMIN=$(curl -s -X POST "$BASE/auth/login" -H 'Content-Type: application/json' -d '{"email":"admin@kokoro.test","password":"Admin123!"}')
ADMIN_TOKEN=$(echo "$ADMIN" | jget "['accessToken']")
STATS=$(curl -s "$BASE/admin/stats" -H "Authorization: Bearer $ADMIN_TOKEN")
check "Admin stats endpoint works" "$([ "$(echo "$STATS" | jget "['cards']['totalUsers']")" -ge 13 ] && echo 0 || echo 1)" "$STATS"

echo "── 20. Premium gating"
FREE=$(curl -s "$BASE/likes/quota" -H "Authorization: Bearer $A_TOKEN")
check "Free tier like limit = 10" "$([ "$(echo "$FREE" | jget "['likesLimit']")" = "10" ] && echo 0 || echo 1)" "$FREE"
PLAN=$(curl -s "$BASE/premium/plans" -H "Authorization: Bearer $A_TOKEN" | python3 -c "import sys,json;print(json.load(sys.stdin)[0]['id'])")
curl -s -X POST "$BASE/premium/subscribe" -H "Authorization: Bearer $A_TOKEN" -H 'Content-Type: application/json' -d "{\"planId\":\"$PLAN\"}" > /dev/null
PREM=$(curl -s "$BASE/premium/me" -H "Authorization: Bearer $A_TOKEN")
check "Premium entitlement granted" "$([ "$(echo "$PREM" | jget "['isPremium']")" = "True" ] && echo 0 || echo 1)" "$PREM"

echo "── 21. Login + refresh + logout"
LI=$(curl -s -X POST "$BASE/auth/login" -H 'Content-Type: application/json' -d '{"email":"nala@example.com","password":"Password123"}')
check "Login works" "$([ "$(echo "$LI" | jget "['user']['email']")" = "nala@example.com" ] && echo 0 || echo 1)"
RT=$(echo "$LI" | jget "['refreshToken']")
NEW=$(curl -s -X POST "$BASE/auth/refresh" -H 'Content-Type: application/json' -d "{\"refreshToken\":\"$RT\"}")
check "Refresh token issues new access token" "$([ -n "$(echo "$NEW" | jget "['accessToken']")" ] && echo 0 || echo 1)" "$NEW"

echo ""
echo "═══════════════════════════════════"
echo "  PASSED: $PASS   FAILED: $FAIL"
echo "═══════════════════════════════════"
[ "$FAIL" = "0" ]
