module TokenAuthenticatable
  extend ActiveSupport::Concern

  included do
    before_action :authenticate_from_token
  end

  private

  def authenticate_from_token
    return if @current_token_user.present?

    token = extract_token_from_header
    return unless token.present?

    @current_token_user = User.find_by(api_token: token)
  end

  def extract_token_from_header
    auth_header = request.headers["Authorization"]
    return nil unless auth_header.present?

    # Handle "Bearer <token>" format
    if auth_header.match(/^Bearer\s+(.+)$/i)
      $1
    else
      nil
    end
  end

  def current_user_from_token
    @current_token_user
  end

  def authenticate_with_token!
    unless current_user_from_token
      render json: { error: "Unauthorized" }, status: :unauthorized
    end
  end

  def token_authenticated?
    current_user_from_token.present?
  end
end
