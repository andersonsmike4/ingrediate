class Api::ChallengesController < ApplicationController
  before_action :authenticate_user_or_token!

  def today
    challenge = CookingChallenge.find_by(challenge_date: Date.current)

    unless challenge
      pantry = PantryItem.where(user_id: current_user.id).pluck(:name)
      saved_count = SavedRecipe.where(user_id: current_user.id).count

      result = ai_service.generate_daily_challenge(
        pantry_items: pantry,
        skill_level: saved_count > 20 ? "advanced" : saved_count > 5 ? "intermediate" : "beginner",
        household: current_household,
        preferences: current_preferences
      )

      challenge = CookingChallenge.create!(
        challenge_text: result[:challenge_text],
        challenge_type: result[:challenge_type] || "general",
        criteria_json: result[:criteria]&.to_json,
        difficulty: result[:difficulty],
        tips_json: (result[:tips] || []).to_json,
        challenge_date: Date.current
      )
    end

    submission = ChallengeSubmission.find_by(user_id: current_user.id, cooking_challenge_id: challenge.id)
    tips = safe_parse_json(challenge.tips_json)

    render json: {
      challenge: challenge.as_json.merge("tips" => tips),
      submitted: submission.present?,
      submission: submission&.as_json
    }
  rescue AiService::Error => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  def submit
    challenge = CookingChallenge.find(params[:id])
    submission = ChallengeSubmission.find_or_initialize_by(user: current_user, cooking_challenge: challenge)
    submission.notes = params[:notes]
    submission.completed_at = Time.current

    if submission.save
      render json: { submission: submission }
    else
      render json: { error: submission.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def history
    submissions = ChallengeSubmission.where(user_id: current_user.id)
      .includes(:cooking_challenge)
      .order(completed_at: :desc)
      .limit(30)

    render json: {
      history: submissions.map { |s|
        { challenge: s.cooking_challenge.as_json, submission: s.as_json }
      }
    }
  end
end
