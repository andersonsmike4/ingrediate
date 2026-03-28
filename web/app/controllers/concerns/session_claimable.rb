module SessionClaimable
  extend ActiveSupport::Concern

  private

  def claim_session_data_for(user)
    sid = session[:_session_id].to_s.presence || session.id.to_s.presence
    return if sid.blank?

    ActiveRecord::Base.transaction do
      [SavedRecipe, MealPlan, CookingLog, RecipeCollection].each do |klass|
        klass.where(session_id: sid.to_s, user_id: nil).update_all(user_id: user.id)
      end

      { PantryItem => :name, ShoppingListItem => :name }.each do |klass, name_attr|
        session_records = klass.where(session_id: sid, user_id: nil)
        existing_names = klass.where(user_id: user.id).pluck(name_attr).map(&:downcase)

        duplicate_ids = []
        claim_ids = []
        session_records.find_each do |record|
          if existing_names.include?(record.send(name_attr).downcase)
            duplicate_ids << record.id
          else
            claim_ids << record.id
          end
        end

        klass.where(id: duplicate_ids).delete_all if duplicate_ids.any?
        klass.where(id: claim_ids).update_all(user_id: user.id) if claim_ids.any?
      end

      if NutritionGoal.exists?(user_id: user.id)
        NutritionGoal.where(session_id: sid, user_id: nil).delete_all
      else
        NutritionGoal.where(session_id: sid, user_id: nil).update_all(user_id: user.id)
      end
    end
  end

end
