{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/admin.html",
      "dest": "/customer_app/admin.html"
    },
    {
      "src": "/driver.html",
      "dest": "/customer_app/driver.html"
    },
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ]
}