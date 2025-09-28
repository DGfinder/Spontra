import { toCityCode, expandCity } from "./cityCodes";

test("airport → city-code", () => {
  expect(toCityCode("LHR")).toBe("LON");
  expect(toCityCode("NRT")).toBe("TYO");
  expect(toCityCode("KIX")).toBe("OSA");
});

test("city-code passthrough", () => {
  expect(toCityCode("NYC")).toBe("NYC");
});

test("expand city to airports", () => {
  expect(expandCity("LON")).toEqual(expect.arrayContaining(["LHR","LGW"]));
});