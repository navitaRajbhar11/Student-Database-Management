# app/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from django.http import JsonResponse, HttpResponseBadRequest
from bson import ObjectId # ✅ Required to handle MongoDB ObjectId
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from bson.objectid import ObjectId
from bson.errors import InvalidId
from rest_framework.parsers import MultiPartParser, FormParser
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
import cloudinary.uploader  # make sure cloudinary is installed and configured
import os
import uuid
from django.conf import settings
from django.views import View
from bson import Binary
from urllib.parse import urljoin
import bcrypt
import datetime
import json
from .db import (
    get_students_collection, get_admins_collection, get_assignments_collection,get_submissions_collection,
    get_schedules_collection, get_videos_lectures_collection,get_queries_collection
)

#-----admin----

# Admin login view
@method_decorator(csrf_exempt, name="dispatch")
class AdminLoginView(View):
    def post(self, request):
        try:
            data = json.loads(request.body)
            email = data.get("email")
            password = data.get("password")

            # Find admin in MongoDB
            admin = get_admins_collection().find_one({"email": email, "password": password})
            
            if admin:
                return JsonResponse({"message": "Login successful!"}, status=200)
            else:
                return JsonResponse({"detail": "Invalid email or password"}, status=401)
        
        except json.JSONDecodeError:
            return JsonResponse({"detail": "Invalid request format"}, status=400)

    def get(self, request):
        return JsonResponse({"detail": "Method not allowed"}, status=405)


#------StudentCreteListDelete---       
class CreateStudentView(APIView):
    def post(self, request):
        name = request.data.get("name")  # ✅ Replaced email with name
        username = request.data.get("username")
        password = request.data.get("password")
        class_grade = int(request.data.get("class_grade"))

        if not name or not username or not password:
            return Response({'error': 'All fields are required'}, status=status.HTTP_400_BAD_REQUEST)

        if class_grade < 1 or class_grade > 12:
            return Response({'error': 'Invalid class_grade. Must be between 1 and 12.'}, status=status.HTTP_400_BAD_REQUEST)

        students = get_students_collection()

        if students.find_one({"username": username}):
            return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)

        student = {
            "name": name,  # ✅ Store name
            "username": username,
            "password": password,  # Note: Storing plain text passwords is unsafe!
            "class_grade": class_grade,
            "created_at": datetime.datetime.now().isoformat(),
        }

        result = students.insert_one(student)
        return Response(
            {'id': str(result.inserted_id), 'name': name, 'username': username, 'class_grade': class_grade},
            status=status.HTTP_201_CREATED,
        )

class ListStudentsView(APIView):
    def get(self, request):
        students = get_students_collection()
        class_grade = request.query_params.get('class_grade')

        try:
            if class_grade is not None:
                class_grade = int(class_grade)
                query = {"class_grade": class_grade}
            else:
                query = {}
        except ValueError:
            return Response({"error": "Invalid class_grade format"}, status=status.HTTP_400_BAD_REQUEST)

        student_list = list(students.find(query))

        for student in student_list:
            student["id"] = str(student["_id"])
            del student["_id"]  # ✅ Remove ObjectId but keep password

        return Response(student_list, status=status.HTTP_200_OK)

class AdminDeleteStudentView(APIView):
    def delete(self, request, student_id):
        students = get_students_collection()
        try:
            result = students.delete_one({"_id": ObjectId(student_id)})

            if result.deleted_count == 1:
                return Response({"message": "✅ Student deleted successfully!"}, status=status.HTTP_200_OK)
            else:
                return Response({"error": "❌ Student not found!"}, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            return Response({"error": f"❌ Error deleting student: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

#------quries----

class AdminViewQueries(APIView):
    def get(self, request):
        class_grade = request.query_params.get("class_grade")
        queries_collection = get_queries_collection()

        query_filter = {"class_grade": int(class_grade)} if class_grade else {}

        queries = list(queries_collection.find(query_filter, {"_id": 1, "studentName": 1, "class_grade": 1, "query": 1}))

        for q in queries:
            q["id"] = str(q["_id"])  # Convert ObjectId to string
            del q["_id"]  # Remove MongoDB default ID

        return Response(queries, status=status.HTTP_200_OK)

class AdminDeleteQuery(APIView):
    def delete(self, request, query_id):
        queries_collection = get_queries_collection()

        if not ObjectId.is_valid(query_id):
            return Response({"error": "Invalid query ID"}, status=status.HTTP_400_BAD_REQUEST)

        result = queries_collection.delete_one({"_id": ObjectId(query_id)})

        if result.deleted_count == 1:
            return Response({"message": "Query deleted successfully"}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Query not found"}, status=status.HTTP_404_NOT_FOUND)


#-----assignment------
class AdminCreateAssignmentView(APIView):
    def post(self, request):
        # Get data from the request body
        title = request.data.get('title')
        description = request.data.get('description')
        due_date = request.data.get('due_date')
        class_grade = request.data.get('class_grade')

        # Validation checks
        if not title or not description or not due_date or not class_grade:
            return Response({"error": "All fields are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Convert class_grade to integer
            class_grade = int(class_grade)
        except ValueError:
            return Response({"error": "Invalid class_grade format"}, status=status.HTTP_400_BAD_REQUEST)

        # Create assignment document
        assignment = {
            'title': title,
            'description': description,
            'due_date': due_date,
            'class_grade': class_grade,
            'created_at': datetime.datetime.now().isoformat(),
        }

        # Insert into MongoDB
        assignments_collection = get_assignments_collection()
        result = assignments_collection.insert_one(assignment)

        return Response({
            'id': str(result.inserted_id), 
            'title': title, 
            'description': description, 
            'due_date': due_date,
            'class_grade': class_grade
        }, status=status.HTTP_201_CREATED)

class AdminDeleteAssignmentView(APIView):
    def delete(self, request, assignment_id):
        # Validate ObjectId
        if not ObjectId.is_valid(assignment_id):
            return Response({"error": "Invalid assignment ID"}, status=status.HTTP_400_BAD_REQUEST)

        # Delete the assignment
        assignments_collection = get_assignments_collection()
        result = assignments_collection.delete_one({'_id': ObjectId(assignment_id)})

        if result.deleted_count == 0:
            return Response({"error": "Assignment not found"}, status=status.HTTP_404_NOT_FOUND)

        return Response({"message": "Assignment deleted successfully"}, status=status.HTTP_200_OK)
   
class AdminListAssignmentView(APIView):
    def get(self, request):
        # Fetch class_grade from query params if provided
        class_grade = request.query_params.get('class_grade')

        # Build the query for MongoDB
        query = {}
        if class_grade:
            try:
                query["class_grade"] = int(class_grade)  # Ensure it's an integer
            except ValueError:
                return Response({"error": "Invalid class_grade format"}, status=status.HTTP_400_BAD_REQUEST)

        # Fetch assignments from MongoDB
        assignments = get_assignments_collection().find(query)

        # Format the assignments list
        assignment_list = []
        for assignment in assignments:
            assignment['_id'] = str(assignment['_id'])  # Convert MongoDB ObjectId to string
            assignment_list.append(assignment)

        return Response(assignment_list, status=status.HTTP_200_OK)

#-----Submission-------

BASE_URL = "https://student-backend-8oa3.onrender.com"  # Used only for local files, not Cloudinary


class ListSubmissionsView(APIView):
    def get(self, request):
        class_grade = request.query_params.get("class_grade")
        submissions_collection = get_submissions_collection()

        query = {"class": str(class_grade)} if class_grade else {}

        # Sort by submitted_at descending
        submission_list = list(submissions_collection.find(query).sort("submitted_at", -1))

        formatted_submissions = []

        for submission in submission_list:
            submitted_at = submission.get("submitted_at")
            if isinstance(submitted_at, datetime.datetime):
                submitted_at = submitted_at.isoformat()

            raw_file_url = submission.get("file_url", "")

            # If URL is already full (e.g., from Cloudinary), use it directly
            full_file_url = (
                raw_file_url if raw_file_url.startswith("http") else urljoin(BASE_URL, raw_file_url)
            )

            formatted = {
                "_id": str(submission.get("_id", "")),
                "student_name": submission.get("student_name", ""),
                "class": submission.get("class", ""),
                "assignment_title": submission.get("assignment_title", ""),
                "filename": submission.get("filename", ""),
                "file_url": full_file_url,
                "viewable_url": full_file_url,  # For preview
                "download_url": full_file_url,  # For download
                "content_type": submission.get("content_type", ""),
                "submitted_at": submitted_at,
                "status": submission.get("status", "Pending")
            }

            formatted_submissions.append(formatted)

        return Response(formatted_submissions, status=status.HTTP_200_OK)


class AdminUpdateSubmissionView(APIView):
    def patch(self, request, submission_id):
        try:
            submissions = get_submissions_collection()
            update_data = request.data

            if not update_data.get("status"):
                return JsonResponse({"error": "'status' field is required."}, status=400)

            if ObjectId.is_valid(submission_id):
                query = {"_id": ObjectId(submission_id)}
            else:
                query = {"_id": submission_id}

            result = submissions.update_one(query, {"$set": {"status": update_data["status"]}})

            if result.modified_count > 0:
                return JsonResponse({"message": "Submission status updated successfully."}, status=200)
            else:
                return JsonResponse({"error": "Submission not found or already updated."}, status=404)

        except Exception as e:
            print("Error in AdminUpdateSubmissionView:", str(e))
            return JsonResponse({"error": str(e)}, status=500)

class AdminDeleteSubmissionView(APIView):
    def delete(self, request, submission_id):
        try:
            submissions = get_submissions_collection()

            if ObjectId.is_valid(submission_id):
                query = {"_id": ObjectId(submission_id)}
            else:
                query = {"_id": submission_id}

            result = submissions.delete_one(query)

            if result.deleted_count > 0:
                return JsonResponse({"message": f"Submission {submission_id} deleted."}, status=200)
            else:
                return JsonResponse({"error": "Submission not found."}, status=404)

        except Exception as e:
            print("Error in AdminDeleteSubmissionView:", str(e))
            return JsonResponse({"error": str(e)}, status=500)

#  --VideosLecture-
class AdminCreateVideoLectureView(APIView):
    def post(self, request):
        try:
            print("📌 Incoming Data:", request.data)

            title = request.data.get('title')
            class_grade = request.data.get('class_grade')
            video_url = request.data.get('video_url')
            description = request.data.get('description', '')
            pdf_url = request.data.get('pdf_url', '')  # ✅ NEW PDF Field

            if not title or not class_grade or not video_url:
                return Response({"error": "Missing required fields"}, status=status.HTTP_400_BAD_REQUEST)

            class_grade = int(class_grade)
            if class_grade < 1 or class_grade > 10:
                return Response({"error": "Class grade must be between 1 and 10"}, status=status.HTTP_400_BAD_REQUEST)

            videos_lectures = get_videos_lectures_collection()
            video_lecture = {
                'title': title,
                'class_grade': class_grade,
                'video_url': video_url,
                'description': description,
                'pdf_url': pdf_url,  # ✅ Store PDF URL
                'created_at': datetime.datetime.now().isoformat()
            }

            result = videos_lectures.insert_one(video_lecture)

            print("✅ Inserted Video ID:", result.inserted_id)
            video_lecture['id'] = str(result.inserted_id)
            del video_lecture['_id']

            return JsonResponse({"message": "Video Lecture Created Successfully!", "video": video_lecture}, status=201)

        except Exception as e:
            print("❌ Error in AdminCreateVideoLectureView:", str(e))
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AdminDeleteVideo(APIView):
    def delete(self, request, video_id):
        try:
            # Check if the ID is valid (ObjectId format)
            if not ObjectId.is_valid(video_id):
                return HttpResponseBadRequest("❌ Invalid video ID format.")

            # Access the video collection
            video_collection = get_videos_lectures_collection()

            # Attempt to delete the video from MongoDB
            result = video_collection.delete_one({"_id": ObjectId(video_id)})

            if result.deleted_count > 0:
                return JsonResponse({"message": f"✅ Video with ID {video_id} deleted successfully."}, status=200)
            else:
                return JsonResponse({"message": "❌ Video not found."}, status=404)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

class AdminListVideosLecturesView(APIView):
    def get(self, request):
        class_grade = request.query_params.get('class_grade')
        videos_lectures = get_videos_lectures_collection()
        query = {'class_grade': int(class_grade)} if class_grade else {}
        video_list = list(videos_lectures.find(query))

        for video in video_list:
            video['id'] = str(video['_id'])
            del video['_id']

        return Response(video_list)

#------Schedule---
class CreateScheduleView(APIView):
    def post(self, request):
        schedules = get_schedules_collection()
        
        schedule_data = {
            "class_grade": request.data.get("class_grade"),
            "subject": request.data.get("subject"),
            "day": request.data.get("day"),
            "start_time": request.data.get("start_time"),
            "end_time": request.data.get("end_time"),
        }

        inserted_schedule = schedules.insert_one(schedule_data)
        schedule_data["_id"] = str(inserted_schedule.inserted_id)  # ✅ Convert ObjectId to string

        return JsonResponse(schedule_data, safe=False, status=201)  # ✅ Use Js

class ListSchedulesView(APIView):
    def get(self, request):
        class_grade = request.query_params.get('class_grade')
        schedules = get_schedules_collection()

        query = {} if not class_grade else {'class_grade': int(class_grade)}
        schedule_list = list(schedules.find(query))

        # ✅ Convert `_id` from ObjectId to string
        for schedule in schedule_list:
            schedule["_id"] = str(schedule["_id"])

        return Response(schedule_list, status=status.HTTP_200_OK)

class AdminDeleteScheduleView(APIView):
    def delete(self, request, schedule_id):
        try:
            # ✅ Validate ObjectId format
            if not ObjectId.is_valid(schedule_id):
                return HttpResponseBadRequest("❌ Invalid schedule ID format.")

            schedules = get_schedules_collection()
            result = schedules.delete_one({"_id": ObjectId(schedule_id)})

            if result.deleted_count > 0:
                return JsonResponse({"message": f"✅ Schedule with ID {schedule_id} deleted successfully."}, status=200)
            else:
                return JsonResponse({"message": "❌ Schedule not found."}, status=404)

        except Exception as e:
            print("❌ Error in AdminDeleteScheduleView:", str(e))
            return JsonResponse({"error": str(e)}, status=500)





#        ---------------------------------STUDENT SIDE----------------------------------------

class StudentLoginView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        # Log the received request data for debugging
        print(f"Received username: {username}, password: {password}")

        # Retrieve the student collection from MongoDB
        students = get_students_collection()

        # Find the student by username
        student = students.find_one({'username': username})

        if student:
            print(f"Found student: {student['username']}")
            # Compare plain text passwords directly
            if password == student['password']:  # Plain text comparison
                student_data = {
                    'id': str(student['_id']),
                    'username': student['username'],
                    'class_grade': student['class_grade']
                }
                print(f"Login successful for {student['username']}")
                return Response(student_data)
            else:
                print("Password mismatch")
                return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        else:
            print(f"Student with username {username} not found")
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

class StudentProfileView(APIView):
    def get(self, request):
        student_id = request.GET.get("student_id")  # Get from query params

        if not student_id:
            return Response({"error": "Student ID is required"}, status=status.HTTP_400_BAD_REQUEST)

        students_collection = get_students_collection()

        try:
            student = students_collection.find_one({"_id": ObjectId(student_id)})
        except Exception as e:
            print(f"Error fetching student: {e}")
            return Response({"error": "Invalid Student ID or database issue"}, status=status.HTTP_400_BAD_REQUEST)

        if student:
            print("Fetched student:", student)  # For debugging
            student_data = {
                "id": str(student["_id"]),
                "name": student.get("name", ""),
                "username": student.get("username", ""),
                "class_grade": student.get("class_grade", ""),
            }
            return Response(student_data, status=status.HTTP_200_OK)

        return Response({"error": "Student not found"}, status=status.HTTP_404_NOT_FOUND)

class StudentListAssignmentsView(APIView):
    def get(self, request):
        student_id = request.query_params.get("student_id")
        class_grade = request.query_params.get("class_grade")

        if not student_id or not class_grade:
            return Response({"error": "Student ID and class_grade are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            class_grade = int(class_grade)
        except ValueError:
            return Response({"error": "Invalid class_grade format."}, status=status.HTTP_400_BAD_REQUEST)

        assignments_collection = get_assignments_collection()
        assignments = assignments_collection.find({"class_grade": class_grade})

        assignment_list = []
        for assignment in assignments:
            assignment['_id'] = str(assignment['_id'])
            assignment_list.append(assignment)

        return Response(assignment_list, status=status.HTTP_200_OK)


class StudentSubmitAssignmentView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        print("🔥 Received POST request for assignment submission")

        student_name = request.data.get("student_name")
        student_class = request.data.get("class")
        assignment_title = request.data.get("assignment_title")
        due_date = request.data.get("due_date")
        file = request.FILES.get("file")

        print(f"✅ student_name: {student_name}")
        print(f"✅ student_class: {student_class}")
        print(f"✅ assignment_title: {assignment_title}")
        print(f"✅ due_date: {due_date}")
        print(f"✅ file: {file}")

        if not all([student_name, student_class, assignment_title, due_date, file]):
            return Response({"error": "All fields are required"}, status=status.HTTP_400_BAD_REQUEST)

        allowed_extensions = ["pdf", "docx"]
        file_extension = file.name.split(".")[-1].lower()
        if file_extension not in allowed_extensions:
            return Response({"error": "Only PDF and DOCX files are allowed."}, status=status.HTTP_400_BAD_REQUEST)

        if file.size > 10 * 1024 * 1024:
            return Response({"error": "File too large. Max size is 10MB."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            datetime.datetime.strptime(due_date, "%Y-%m-%d")
        except ValueError:
            return Response({"error": "Invalid due_date format. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)

        # Upload to Cloudinary
        try:
            print("🚀 Uploading file to Cloudinary...")
            upload_result = cloudinary.uploader.upload(
                file,
                folder="assignments",
                use_filename=True,
                unique_filename=False,
                resource_type="auto"  # Let Cloudinary handle file type
            )
            viewable_url = upload_result.get("secure_url")

            # Create download URL (forces download)
            public_id = upload_result.get("public_id")
            file_format = upload_result.get("format")
            cloud_name = upload_result.get("url").split("/")[3]  # auto-extract
            download_url = f"https://res.cloudinary.com/{cloud_name}/raw/upload/fl_attachment/{public_id}.{file_format}"

            print("✅ Uploaded to Cloudinary.")
            print("🔗 Viewable URL:", viewable_url)
            print("📥 Download URL:", download_url)

        except Exception as e:
            print("❌ Cloudinary Upload Error:", e)
            return Response({"error": "Failed to upload to Cloudinary."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Save metadata to MongoDB
        try:
            submissions_collection = get_submissions_collection()
            submission_data = {
                "student_name": student_name,
                "class": student_class,
                "assignment_title": assignment_title,
                "due_date": due_date,
                "filename": file.name,
                "file_url": viewable_url,
                "download_url": download_url,
                "content_type": file.content_type,
                "submitted_at": datetime.datetime.utcnow().isoformat(),
                "status": "Pending"
            }
            submissions_collection.insert_one(submission_data)
            print("📝 Submission saved to MongoDB.")
        except Exception as e:
            print("❌ MongoDB Insert Error:", e)
            return Response({"error": "Failed to save submission."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            "message": "Assignment submitted successfully",
            "viewable_url": viewable_url,
            "download_url": download_url
        }, status=status.HTTP_201_CREATED)

#videos

class StudentListVideosLecturesView(APIView):
    def get(self, request):
        class_grade = request.query_params.get('class_grade')
        videos_lectures = get_videos_lectures_collection()

        query = {'class_grade': int(class_grade)} if class_grade else {}
        video_list = list(videos_lectures.find(query))

        for video in video_list:
            video['id'] = str(video['_id'])   # ✅ Convert ObjectId to string
            video.pop('_id', None)            # ✅ Remove _id from response

        return Response(video_list)


class StudentQueryView(APIView):
    def post(self, request):
        data = request.data
        student_name = data.get("studentName")
        class_grade = data.get("class_grade")
        query_text = data.get("query")

        # Basic validation
        if not all([student_name, class_grade, query_text]):
            return Response({"error": "Missing required fields."}, status=status.HTTP_400_BAD_REQUEST)

        queries_collection = get_queries_collection()

        new_query = {
            "studentName": student_name,
            "class_grade": int(class_grade),
            "query": query_text
        }

        inserted = queries_collection.insert_one(new_query)

        return Response(
            {"message": "Query uploaded successfully.", "query_id": str(inserted.inserted_id)},
            status=status.HTTP_201_CREATED
        )

class StudentScheduleView(APIView):
    def get(self, request):
        class_grade = request.query_params.get('class_grade')
        schedules = get_schedules_collection()

        if not class_grade:
            return Response(
                {"error": "Class grade is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            query = {'class_grade': int(class_grade)}
            schedule_list = list(schedules.find(query))

            for schedule in schedule_list:
                schedule["_id"] = str(schedule["_id"])

            return Response(schedule_list, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": "Failed to fetch schedule.", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
