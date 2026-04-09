import desert from "../Images/Banners/desert.jpg";
import galaxy from "../Images/Banners/galaxy.jpg";
import mountain from "../Images/Banners/mountain.jpg";
import mountainRange from "../Images/Banners/mountainRange.jpg";
import pond from "../Images/Banners/pond.jpg";
import rain from "../Images/Banners/rain.jpg";

const courseImages = [desert, galaxy, mountain, mountainRange, pond, rain];

export function getCourseImage(course) {
  const key = `${course.course_code || ""}${course.id || course.course_id || ""}`;
  let hash = 0;

  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % courseImages.length;
  return courseImages[index];
}