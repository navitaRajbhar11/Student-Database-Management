import React from "react";
import "../style.css";
import icon from "../assets/icon_1.png";

function Navbar() {
  return (
    <header className="p-5 bg-coolGray-100 text-coolGray-800 w-full bg-green-300">
      <div className="container flex justify-between h-16 mx-auto">
        <a
          href="#"
          aria-label="Back to homepage"
          className="flex items-center p-2"
        >
          <img src={icon} alt="Online Classes Icon" className="logo-img" />
        </a>
        <ul className="items-stretch hidden space-x-3 lg:flex">
          <li className="flex hover:text-red-600">
            <a
              href="/home"
              className="flex items-center px-4 -mb-1 border-b-2 border-transparent"
            >
              Home
            </a>
          </li>
          <li className="flex hover:text-red-600">
            <a
              href="/student-record"
              className="flex items-center px-4 -mb-1 border-b-2 border-transparent"
            >
              {/* viewsRecord */}
              StudentRecord{" "}
            </a>
          </li>
          <li className="flex hover:text-red-600">
            <a
              href="/submission"
              className="flex items-center px-4 -mb-1 border-b-2 border-transparent"
            >
              Submission
            </a>
          </li>
          <li className="flex hover:text-red-600">
            <a
              href="/assignment-list"
              className="flex items-center px-4 -mb-1 border-b-2 border-transparent"
            >
              Assignment
            </a>
          </li>
          <li className="flex hover:text-red-600">
            <a
              href="/list-videos"
              className="flex items-center px-4 -mb-1 border-b-2 border-transparent"
            >
              Video Lectures & Notes
            </a>
          </li>
          <li className="flex hover:text-red-600">
            <a
              href="/list-schedule"
              className="flex items-center px-4 -mb-1 border-b-2 border-transparent"
            >
              Class Schedule
            </a>
          </li>
        </ul>
        <div className="items-center flex-shrink-0 hidden lg:flex">
          <button className="self-center px-8 py-3 font-semibold rounded bg-blue-600 text-white  hover:bg-violet-600">
            <a href="/">Logout</a>
          </button>
        </div>

        <button className="p-4 lg:hidden">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="w-6 h-6 text-coolGray-800"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16M4 18h16"
            ></path>
          </svg>
        </button>
      </div>
    </header>
  );
}

export default Navbar;
