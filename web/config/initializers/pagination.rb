module Pagination
  DEFAULT_LIMIT = 20
  MAX_LIMIT = 50

  def self.limit_for(params, default: DEFAULT_LIMIT)
    requested = params[:limit].to_i
    requested > 0 ? [requested, MAX_LIMIT].min : default
  end
end
