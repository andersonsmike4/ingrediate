class Api::SubstitutionLogsController < ApplicationController
  before_action :authenticate_user_or_token!

  def index
    logs = SubstitutionLog.where(user_id: current_user.id).order(created_at: :desc).limit(Pagination::MAX_LIMIT)
    render json: { substitution_logs: logs }
  end

  def create
    log = SubstitutionLog.new(log_params)
    log.user = current_user
    if log.save
      render json: { substitution_log: log }, status: :created
    else
      render json: { error: log.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def lookup
    logs = SubstitutionLog.where(user_id: current_user.id, original_ingredient: params[:ingredient])
      .order(rating: :desc)
    render json: { substitutions: logs }
  end

  private

  def log_params
    params.permit(:original_ingredient, :substitute_ingredient, :recipe_name, :rating, :notes)
  end
end
