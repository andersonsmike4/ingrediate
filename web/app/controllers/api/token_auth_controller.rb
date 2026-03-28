class Api::TokenAuthController < ApplicationController
  include SessionClaimable
  skip_before_action :verify_authenticity_token, only: [:sign_in, :sign_up]
  before_action :authenticate_with_token!, only: [:sign_out]

  # POST /api/auth/token/sign_in
  def sign_in
    user = User.find_by(email: sign_in_params[:email])

    if user&.valid_password?(sign_in_params[:password])
      # Ensure user has an api_token (for existing users)
      user.regenerate_api_token! if user.api_token.blank?

      claim_session_data_for(user)

      render json: {
        user: user_json(user),
        token: user.api_token
      }, status: :ok
    else
      render json: { error: "Invalid email or password" }, status: :unauthorized
    end
  rescue StandardError => e
    Rails.logger.error("Token sign-in error: #{e.message}")
    render json: { error: "An error occurred during sign in" }, status: :internal_server_error
  end

  # POST /api/auth/token/sign_up
  def sign_up
    user = User.new(sign_up_params)

    if user.save
      # has_secure_token automatically generates api_token on create
      claim_session_data_for(user)

      render json: {
        user: user_json(user),
        token: user.api_token
      }, status: :created
    else
      render json: { error: user.errors.full_messages }, status: :unprocessable_entity
    end
  rescue StandardError => e
    Rails.logger.error("Token sign-up error: #{e.message}")
    render json: { error: "An error occurred during sign up" }, status: :internal_server_error
  end

  # DELETE /api/auth/token/sign_out
  def sign_out
    current_user_from_token.regenerate_api_token!
    render json: { message: "Signed out successfully" }, status: :ok
  rescue StandardError => e
    Rails.logger.error("Token sign-out error: #{e.message}")
    render json: { error: "An error occurred during sign out" }, status: :internal_server_error
  end

  private

  def sign_in_params
    params.require(:user).permit(:email, :password)
  rescue ActionController::ParameterMissing
    # Allow params at root level too (for flexibility)
    params.permit(:email, :password)
  end

  def sign_up_params
    params.require(:user).permit(:name, :email, :password, :password_confirmation)
  rescue ActionController::ParameterMissing
    # Allow params at root level too (for flexibility)
    params.permit(:name, :email, :password, :password_confirmation)
  end
end
