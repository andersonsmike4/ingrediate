class Api::BudgetController < ApplicationController
  def summary
    purchases = GroceryPurchase.for_owner(owner_conditions)

    month_start = Date.current.beginning_of_month
    monthly = purchases.where("purchased_at >= ?", month_start)

    render json: {
      monthly_total_cents: monthly.sum(:actual_price_cents),
      monthly_count: monthly.count,
      all_time_total_cents: purchases.sum(:actual_price_cents),
      recent_purchases: purchases.order(purchased_at: :desc).limit(Pagination::DEFAULT_LIMIT).as_json
    }
  end

  def log_purchase
    purchase = GroceryPurchase.new(purchase_params)
    assign_owner(purchase)

    if purchase.save
      render json: { purchase: purchase }, status: :created
    else
      render json: { error: purchase.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def purchase_params
    params.permit(:item_name, :actual_price_cents, :purchased_at, :store_name)
  end
end
