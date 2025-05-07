import { endAt, get, orderByKey, query, ref, startAt } from "firebase/database";

import { database } from "./Firebase.js";

export const fetchHolidays = async (startDate, endDate) => {
  try {
    const holidaysRef = ref(database, `/holidays`);

    const attendanceQuery = query(
      holidaysRef,
      orderByKey(),
      startAt(startDate),
      endAt(endDate)
    );

    const snapshot = await get(attendanceQuery);

    if (snapshot.exists()) {
      const data = snapshot.val();

      const holidaysData = Object.entries(data).map(([key, value]) => ({
        date: key,
        reason: value,
      }));

      return holidaysData;
    }
  } catch (error) {
    console.error("Error fetching holidays:", error);
  }

  return [];
};

export const fetchHoliday = async (date) => {
  try {
    const holidaysRef = ref(database, `/holidays/${date}`);

    const snapshot = await get(holidaysRef);

    if (snapshot.exists()) {
      return snapshot.val();
    }
  } catch (error) {
    console.error("Error fetching holiday:", error);
  }

  return null;
};
