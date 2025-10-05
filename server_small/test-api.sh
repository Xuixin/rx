#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

API_URL="http://localhost:3000"

echo -e "${BLUE}🧪 Testing API Server${NC}\n"

# Test 1: Health Check
echo -e "${GREEN}1. Health Check${NC}"
curl -s "$API_URL/health" | jq
echo -e "\n"

# Test 2: Get All Transactions
echo -e "${GREEN}2. Get All Transactions${NC}"
curl -s "$API_URL/api/transactions" | jq '.data | length'
echo -e "\n"

# Test 3: Create Transaction
echo -e "${GREEN}3. Create Transaction${NC}"
curl -s -X POST "$API_URL/api/transactions" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-'$(date +%s)'",
    "userName": "ทดสอบ ระบบ",
    "status": "IN",
    "subject": ["ทดสอบ API"],
    "organization": ["test-org"],
    "licensePlateNumber": "ทดสอบ 123",
    "phoneNumber": "0899999999",
    "parkingDoorNumber": "TEST",
    "entryTime": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "exitTime": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "isSynced": false
  }' | jq
echo -e "\n"

# Test 4: Get Unsynced Transactions
echo -e "${GREEN}4. Get Unsynced Transactions${NC}"
curl -s "$API_URL/api/transactions/sync/pending" | jq '.count'
echo -e "\n"

# Test 5: Get All Exception Logs
echo -e "${GREEN}5. Get All Exception Logs${NC}"
curl -s "$API_URL/api/exception-logs" | jq '.data | length'
echo -e "\n"

# Test 6: Create Exception Log
echo -e "${GREEN}6. Create Exception Log${NC}"
curl -s -X POST "$API_URL/api/exception-logs" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-log-'$(date +%s)'",
    "message": "Test error from script",
    "serviceName": "TestService",
    "errorType": "TestError",
    "code": "TEST_001",
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "parkingDoorNumber": "TEST",
    "isSynced": false
  }' | jq
echo -e "\n"

echo -e "${BLUE}✅ All tests completed!${NC}"

