export function getKeyName(...args: string[]) {
  return `bites:${args.join(":")}`;
}

export const restaurantKeyById = (id: string) => getKeyName("restaurants", id);
export const reviewKeyById = (id: string) => getKeyName("reviews", id);
export const reviewDetailsKeyById = (id: string) =>
  getKeyName("reviews_details", id);
export const cuisinesKey = getKeyName("cuisines");
export const cuisineKey = (name: string) => getKeyName("cuisine", name);
export const restaurantKeyIdByCuisine = (id: string) =>
  getKeyName("restaurants_by_cuisine", id);
export const restaurantsByRatingKey = getKeyName("restaurants_by_rating");
export const weatherKeyById = (id: string) => getKeyName("weather", id);
export const restaurantDetailsKeyById = (id: string) =>
  getKeyName("restaurants_details", id);
export const indexKey = getKeyName("idx", "restaurants");
export const bloomKey = getKeyName("bloom_restaurants");