use socialhub;

// Create test user
db.users.insertOne({
  "_id": "temp-user-id",
  "username": "testuser",
  "email": "test@socialhub.com",
  "displayName": "Test User",
  "avatarUrl": "https://via.placeholder.com/100",
  "bio": "This is a test user for development",
  "role": "USER",
  "status": "ACTIVE",
  "createdAt": new Date(),
  "updatedAt": new Date()
});

print("Test user created successfully!");
