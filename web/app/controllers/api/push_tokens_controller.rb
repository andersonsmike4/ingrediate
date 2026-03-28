module Api
  class PushTokensController < ApplicationController
    include TokenAuthenticatable

    before_action :authenticate_token_user!

    def create
      push_token = current_user.push_tokens.find_or_initialize_by(token: params[:token])
      push_token.platform = params[:platform]

      if push_token.save
        render json: { status: "registered" }, status: :ok
      else
        render json: { error: push_token.errors.full_messages.join(", ") }, status: :unprocessable_entity
      end
    end

    def destroy
      push_token = current_user.push_tokens.find_by(token: params[:token])
      push_token&.destroy
      head :no_content
    end
  end
end
