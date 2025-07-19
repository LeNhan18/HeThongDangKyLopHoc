import React, { useEffect, useState } from "react";
import axios from "axios";
import CourseCard from "./CourseCard";
import "./CourseList.css";

export default function CourseList() {
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    axios.get("http://localhost:8000/courses/")
      .then(res => setCourses(res.data))
      .catch(() => setCourses([]));
  }, []);

  const filtered = courses.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section className="course-list" id="courses">
      <h2>Explore Our Course</h2>
      <div className="course-search">
        <input
          type="text"
          placeholder="Search Courses"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div className="course-cards">
        {filtered.length === 0 ? (
          <div>Không có khóa học nào.</div>
        ) : (
          filtered.map(course => <CourseCard key={course.id} course={course} />)
        )}
      </div>
    </section>
  );
} 