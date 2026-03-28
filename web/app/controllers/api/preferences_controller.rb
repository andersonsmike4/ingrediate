class Api::PreferencesController < ApplicationController
  before_action :authenticate_user_or_token!

  def show
    pref = current_user.user_preference || current_user.build_user_preference
    render json: { preferences: pref.preferences }
  end

  def update
    pref = current_user.user_preference || current_user.build_user_preference
    pref.preferences = params.permit(
      dietary_restrictions: [],
      allergens: [],
      :spice_tolerance,
      preferred_cuisines: [],
      preferred_proteins: [],
      :calorie_preference,
      household_members: [:name, :age]
    ).to_h
    if pref.save
      render json: { preferences: pref.preferences }
    else
      render json: { error: pref.errors.full_messages }, status: :unprocessable_entity
    end
  end
end
