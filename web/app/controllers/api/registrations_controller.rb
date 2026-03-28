class Api::RegistrationsController < Devise::RegistrationsController
  include SessionClaimable
  respond_to :json

  private

  def respond_with(resource, _opts = {})
    if resource.persisted?
      claim_session_data_for(resource)
      render json: { user: user_json(resource) }, status: :created
    else
      render json: { error: resource.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def sign_up_params
    params.require(:user).permit(:email, :password, :password_confirmation, :name)
  end
end
