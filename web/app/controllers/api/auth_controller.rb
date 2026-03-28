class Api::AuthController < ApplicationController
  def status
    if user_signed_in?
      render json: { authenticated: true, user: user_json(current_user) }
    else
      render json: { authenticated: false, user: nil }
    end
  end
end
