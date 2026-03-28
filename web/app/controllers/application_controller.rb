class ApplicationController < ActionController::Base
  include TokenAuthenticatable

  allow_browser versions: :modern, unless: -> { request.path.start_with?("/api/") }

  before_action :skip_csrf_for_token_auth
  after_action :set_csrf_cookie

  private

  # Authenticate via Devise session OR Bearer token
  def authenticate_user_or_token!
    return if user_signed_in?

    render json: { error: "You need to sign in or sign up before continuing." }, status: :unauthorized
  end

  def ai_service
    @ai_service ||= AiService.new
  end

  # Override Devise's current_user to support token auth
  def current_user
    super || current_user_from_token
  end

  # Override Devise's user_signed_in? to support token auth
  def user_signed_in?
    super || token_authenticated?
  end

  # Skip CSRF verification for requests authenticated with Bearer tokens
  def skip_csrf_for_token_auth
    return unless token_authenticated?

    # Mark this request as verified so Rails skips the CSRF check
    @marked_for_same_origin_verification = false
  end

  # Expose CSRF token as a cookie so JS can always read the latest value,
  # even after Devise rotates the session on sign-in.
  # Skip for token-authenticated requests (mobile doesn't need this)
  def set_csrf_cookie
    return if token_authenticated?

    cookies["CSRF-TOKEN"] = {
      value: form_authenticity_token,
      same_site: :lax
    }
  end

  def current_session_id
    return nil if token_authenticated?
    session[:_session_id] ||= session.id
    session.id.to_s
  end

  def owner_conditions
    if user_signed_in?
      { user_id: current_user.id }
    else
      { session_id: current_session_id }
    end
  end

  def assign_owner(record)
    if user_signed_in?
      record.user_id = current_user.id
    else
      record.session_id = current_session_id
    end
  end

  def user_json(user)
    { id: user.id, email: user.email, name: user.name, avatar_url: user.avatar_url }
  end

  def current_household
    return nil unless user_signed_in?
    prefs = current_preferences
    return nil unless prefs
    members = prefs[:household_members] || prefs["household_members"]
    members.presence
  end

  def current_preferences
    return nil unless user_signed_in?
    pref = current_user.user_preference
    return nil unless pref
    pref.preferences
  end

  # Skip CSRF for all API requests (called by mobile app, not browser)
  def verified_request?
    super || request.path.start_with?("/api/")
  end

  def safe_parse_json(json_string, default = [])
    return default if json_string.blank?
    JSON.parse(json_string)
  rescue JSON::ParserError
    default
  end
end
