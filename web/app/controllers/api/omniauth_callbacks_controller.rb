class Api::OmniauthCallbacksController < Devise::OmniauthCallbacksController
  include SessionClaimable

  def google_oauth2
    user = User.from_omniauth(request.env["omniauth.auth"])
    if user.persisted?
      claim_session_data_for(user)
      sign_in(user)
      redirect_to "/?auth=success", allow_other_host: false
    else
      redirect_to "/?auth=failure", allow_other_host: false
    end
  end

  def failure
    redirect_to "/?auth=failure", allow_other_host: false
  end
end
