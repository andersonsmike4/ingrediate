class Api::AchievementsController < ApplicationController
  before_action :authenticate_user_or_token!

  def index
    all_achievements = Achievement.all

    streak = calculate_streak
    total_cooked = CookingLog.where(user_id: current_user.id).count
    total_saved = SavedRecipe.where(user_id: current_user.id).count

    check_and_unlock_achievements(streak, total_cooked, total_saved)

    unlocked_ids = current_user.user_achievements.pluck(:achievement_id)
    newly_unlocked = params[:since] ? current_user.user_achievements.where("unlocked_at > ?", Time.parse(params[:since])).includes(:achievement).map(&:achievement) : []

    render json: {
      achievements: all_achievements.map { |a|
        { id: a.id, name: a.name, description: a.description, icon: a.icon, category: a.category, points: a.points, unlocked: unlocked_ids.include?(a.id) }
      },
      streak: streak,
      total_cooked: total_cooked,
      total_saved: total_saved,
      total_points: all_achievements.select { |a| unlocked_ids.include?(a.id) }.sum(&:points),
      newly_unlocked: newly_unlocked.map { |a| { name: a.name, icon: a.icon, description: a.description } }
    }
  end

  private

  def calculate_streak
    dates = CookingLog.where(user_id: current_user.id).order(cooked_at: :desc).pluck(:cooked_at).map(&:to_date).uniq
    return 0 if dates.empty?

    streak = 0
    current_date = Date.current
    # Allow today or yesterday as start
    return 0 unless dates.first >= current_date - 1

    dates.each_with_index do |date, i|
      expected = current_date - i
      expected = current_date - 1 - i if dates.first < current_date
      break unless date == (dates.first == current_date ? current_date - i : current_date - 1 - i)
      streak += 1
    end
    streak
  end

  def check_and_unlock_achievements(streak, total_cooked, total_saved)
    # Batch-load all existing achievement IDs for this user
    existing_ids = UserAchievement.where(user_id: current_user.id).pluck(:achievement_id)

    Achievement.find_each do |achievement|
      next if existing_ids.include?(achievement.id)

      criteria = safe_parse_json(achievement.criteria_json, {}).symbolize_keys
      unlocked = case criteria[:type]
      when "streak" then streak >= (criteria[:count] || 0)
      when "total_cooked" then total_cooked >= (criteria[:count] || 0)
      when "total_saved" then total_saved >= (criteria[:count] || 0)
      when "first_cook" then total_cooked >= 1
      when "first_save" then total_saved >= 1
      else false
      end

      if unlocked
        UserAchievement.create(user_id: current_user.id, achievement_id: achievement.id, unlocked_at: Time.current)
      end
    end
  end
end
