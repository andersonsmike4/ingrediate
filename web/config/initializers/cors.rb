# Be sure to restart your server when you modify this file.

# Avoid CORS issues when API is called from the frontend app (mobile).
# Handle Cross-Origin Resource Sharing (CORS) in order to accept cross-origin AJAX requests.

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    # Allow mobile apps to access API from any origin
    # In production, you may want to restrict this to specific origins
    origins "*"

    resource "/api/*",
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      credentials: false,
      max_age: 600
  end
end
