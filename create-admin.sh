#!/bin/bash
# Create admin user on production site
echo "Creating admin user on tellurideskihotels.com..."
curl -X POST https://tellurideskihotels.com/.netlify/functions/setup-admin \
  -H "Authorization: Bearer change-this-secret-key" \
  -H "Content-Type: application/json"
echo ""
echo "Done! You can now login at: https://tellurideskihotels.com/admin/login"
echo "Email: admin@tellurideskihotels.com"
echo "Password: Voy79262!@#"

