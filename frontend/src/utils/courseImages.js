import desert from "../Images/Banners/desert.jpg";
import galaxy from "../Images/Banners/galaxy.jpg";
import mountain from "../Images/Banners/mountain.jpg";
import mountainRange from "../Images/Banners/mountainRange.jpg";
import pond from "../Images/Banners/pond.jpg";
import rain from "../Images/Banners/rain.jpg";

const STORAGE_KEY = "nextmark-course-image-map-v1";

const imageEntries = [
  { id: "desert", src: desert },
  { id: "galaxy", src: galaxy },
  { id: "mountain", src: mountain },
  { id: "mountainRange", src: mountainRange },
  { id: "pond", src: pond },
  { id: "rain", src: rain },
];

function getCourseKey(course) {
  return String(
    course?.course_id ??
      `${course?.course_code || "course"}-${course?.id || "unknown"}`
  );
}

function readStoredMap() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveStoredMap(map) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore localStorage failures
  }
}

function getImageById(imageId) {
  return imageEntries.find((img) => img.id === imageId) || null;
}

function hashString(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export function assignImagesToCourses(courses = []) {
  const storedMap = readStoredMap();
  const updatedMap = { ...storedMap };

  const courseKeys = courses.map(getCourseKey);

  const usedImageIds = new Set(
    courseKeys
      .map((key) => updatedMap[key])
      .filter((imageId) => getImageById(imageId))
  );

  for (const course of courses) {
    const key = getCourseKey(course);
    const existingImageId = updatedMap[key];

    if (existingImageId && getImageById(existingImageId)) {
      continue;
    }

    const availableImage = imageEntries.find((img) => !usedImageIds.has(img.id));

    if (availableImage) {
      updatedMap[key] = availableImage.id;
      usedImageIds.add(availableImage.id);
      continue;
    }

    const fallbackImage = imageEntries[hashString(key) % imageEntries.length];
    updatedMap[key] = fallbackImage.id;
  }

  saveStoredMap(updatedMap);

  return courses.map((course) => {
    const key = getCourseKey(course);
    const imageId = updatedMap[key];
    const image = getImageById(imageId) || imageEntries[0];

    return {
      ...course,
      image: image.src,
    };
  });
}

export function getCourseImage(course) {
  const key = getCourseKey(course);
  const storedMap = readStoredMap();
  const storedImage = getImageById(storedMap[key]);

  if (storedImage) {
    return storedImage.src;
  }

  return imageEntries[hashString(key) % imageEntries.length].src;
}