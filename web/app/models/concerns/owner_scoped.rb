module OwnerScoped
  extend ActiveSupport::Concern

  included do
    belongs_to :user, optional: true
    validate :must_have_owner

    scope :for_owner, ->(conditions) { where(conditions) }
  end

  private

  def must_have_owner
    errors.add(:base, "Must belong to a user or session") unless user_id.present? || session_id.present?
  end
end
