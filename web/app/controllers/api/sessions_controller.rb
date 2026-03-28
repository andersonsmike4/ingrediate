class Api::SessionsController < Devise::SessionsController
  include SessionClaimable
  respond_to :json

  private

  def respond_with(resource, _opts = {})
    if resource.persisted?
      claim_session_data_for(resource)
      render json: { user: user_json(resource) }
    else
      render json: { error: "Invalid email or password" }, status: :unauthorized
    end
  end

  def respond_to_on_destroy
    render json: { message: "Signed out successfully" }
  end
end
