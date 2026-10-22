#!/bin/bash
# Check users in MongoDB via Spring Boot

echo "🔍 Checking users in MongoDB..."
echo ""

# Start backend briefly to check logs
mvn spring-boot:run 2>&1 | grep -E "(Seed user|DataInitializer|Test User)" | head -20 &
PID=$!

sleep 10
kill $PID 2>/dev/null

echo ""
echo "✅ Check backend logs above for user creation info"
