import { L as LITEAPI_MARKUP_PERCENT, l as liteAPIClient } from './client_-0ANb5Ks.mjs';
import { b as applyMarkup } from './utils_CwWswjZg.mjs';

async function searchRates(params) {
  const searchParams = new URLSearchParams();
  const hotelIds = Array.isArray(params.hotelIds) ? params.hotelIds.join(",") : params.hotelIds;
  searchParams.append("hotelIds", hotelIds);
  searchParams.append("checkIn", params.checkIn);
  searchParams.append("checkOut", params.checkOut);
  searchParams.append("adults", params.adults.toString());
  if (params.children) searchParams.append("children", params.children.toString());
  searchParams.append("margin", (params.margin || LITEAPI_MARKUP_PERCENT).toString());
  const endpoint = `/hotels/rates?${searchParams.toString()}`;
  const response = await liteAPIClient(endpoint);
  if (response.data) {
    response.data.forEach((hotel) => {
      hotel.rooms.forEach((room) => {
        room.rates.forEach((rate) => {
          if (rate.net?.amount && rate.total?.amount) {
            const markedUpPrice = applyMarkup(rate.net.amount, LITEAPI_MARKUP_PERCENT);
            rate.total.amount = Math.round(markedUpPrice * 100) / 100;
          }
        });
      });
    });
  }
  return response;
}

export { searchRates };
