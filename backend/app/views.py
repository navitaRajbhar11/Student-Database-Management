from rest_framework.views import APIView
from rest_framework.response import Response
from django.http import JsonResponse, HttpResponseBadRequest
from bson import ObjectId
from rest_framework import status
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from bson.errors import InvalidId
from rest_framework.parsers import MultiPartParser, FormParser
import cloudinary.uploader
from pymongo.errors import PyMongoError
import datetime
import json
from .db import (
    get_students_collection, get_admins_collection, get_assignments_collection,
    get_submissions_collection, get_schedules_collection, get_videos_lectures_collection, get_queries_collection
)

# -----admin-----

@method_decorator(csrf_exempt, name="dispatch")
class AdminLoginView(View):
    def post(self, request):
        try:
            data = json.loads(request.body)
            email = data.get("email")
            password = data.get("password")

            # Use indexes to speed up the query
            admin = get_admins_collection().find_one({"email": email, "password": password})
            
            if admin:
                return JsonResponse({"message": "Login successful!"}, status=200)
            else:
                return JsonResponse({"detail": "Invalid email or password"}, status=401)
        
        except json.JSONDecodeError:
            return JsonResponse({"detail": "Invalid request format"}, status=400)

    def get(self, request):
        return JsonResponse({"detail": "Method not allowed"}, status=405)


# ------StudentCreateListDelete---

class CreateStudentView(APIView):
    def post(self, request):
        name = request.data.get("name")
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
            "name": name,
            "username": username,
            "password": password,
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

        query = {"class_grade": int(class_grade)} if class_grade else {}

        student_list = list(students.find(query, {'_id': 0}))  # Use projection to exclude the _id field
        return Response(student_list, status=status.HTTP_200_OK)


class AdminDeleteStudentView(APIView):
    def delete(self, request, student_id):
        students = get_students_collection()
        try:
            result = students.delete_one({"_id": ObjectId(student_id)})

            if result.deleted_count == 1:
                return Response({"message": "Student deleted successfully!"}, status=status.HTTP_200_OK)
            else:
                return Response({"error": "Student not found!"}, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            return Response({"error": f"Error deleting student: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# -----Queries-----

class AdminViewQueries(APIView):
    def get(self, request):
        class_grade = request.query_params.get("class_grade")
        queries_collection = get_queries_collection()

        query_filter = {"class_grade": int(class_grade)} if class_grade else {}

        queries = list(queries_collection.find(query_filter, {"_id": 0, "studentName": 1, "class_grade": 1, "query": 1}))

        return Response(queries, status=status.HTTP_200_OK)


class AdminDeleteQuery(APIView):
    def delete(self, request, query_id):
        queries_collection = get_queries_collection()

        # Validate query ID format
        if not ObjectId.is_valid(query_id):
            return Response({"error": "Invalid query ID"}, status=status.HTTP_400_BAD_REQUEST)

        result = queries_collection.delete_one({"_id": ObjectId(query_id)})

        if result.deleted_count == 1:
            return Response({"message": "Query deleted successfully"}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Query not found"}, status=status.HTTP_404_NOT_FOUND)


# -----Assignment-----

class AdminCreateAssignmentView(APIView):
    def post(self, request):
        title = request.data.get('title')
        description = request.data.get('description')
        due_date = request.data.get('due_date')
        class_grade = request.data.get('class_grade')

        if not title or not description or not due_date or not class_grade:
            return Response({"error": "All fields are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            class_grade = int(class_grade)
        except ValueError:
            return Response({"error": "Invalid class_grade format"}, status=status.HTTP_400_BAD_REQUEST)

        assignment = {
            'title': title,
            'description': description,
            'due_date': due_date,
            'class_grade': class_grade,
            'created_at': datetime.datetime.now().isoformat(),
        }

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
        if not ObjectId.is_valid(assignment_id):
            return Response({"error": "Invalid assignment ID"}, status=status.HTTP_400_BAD_REQUEST)

        assignments_collection = get_assignments_collection()
        result = assignments_collection.delete_one({'_id': ObjectId(assignment_id)})

        if result.deleted_count == 0:
            return Response({"error": "Assignment not found"}, status=status.HTTP_404_NOT_FOUND)

        return Response({"message": "Assignment deleted successfully"}, status=status.HTTP_200_OK)


class AdminListAssignmentView(APIView):
    def get(self, request):
        class_grade = request.query_params.get('class_grade')
        query = {"class_grade": int(class_grade)} if class_grade else {}

        assignments = get_assignments_collection().find(query, {'_id': 0})

        return Response(list(assignments), status=status.HTTP_200_OK)


# -----Submission-----

BASE_URL = "https://student-backend-8oa3.onrender.com"  # Used for local files

class ListSubmissionsView(APIView):
    def get(self, request):
        class_grade = request.query_params.get("class_grade")
        submissions_collection = get_submissions_collection()

        query = {"class": str(class_grade)} if class_grade else {}
        submission_list = list(submissions_collection.find(query).sort("submitted_at", -1))

        for submission in submission_list:
            submission["submitted_at"] = submission["submitted_at"].isoformat()
            submission["file_url"] = submission.get("file_url", "")

        return Response(submission_list, status=status.HTTP_200_OK)


# -----Videos-----

class AdminCreateVideoLectureView(APIView):
    def post(self, request):
        title = request.data.get('title')
        class_grade = request.data.get('class_grade')
        video_url = request.data.get('video_url')
        description = request.data.get('description', '')
        pdf_url = request.data.get('pdf_url', '')

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
            'pdf_url': pdf_url,
            'created_at': datetime.datetime.now().isoformat()
        }

        result = videos_lectures.insert_one(video_lecture)

        return JsonResponse({"message": "Video Lecture Created Successfully!", "video": video_lecture}, status=201)


class AdminListVideosLecturesView(APIView):
    def get(self, request):
        class_grade = request.query_params.get('class_grade')
        query = {'class_grade': int(class_grade)} if class_grade else {}
        video_list = list(get_videos_lectures_collection().find(query, {'_id': 0}))

        return Response(video_list)


# -----Schedule-----

class CreateScheduleView(APIView):
    def post(self, request):
        schedules = get_schedules_collection()

        # Collecting data from the request body
        schedule_data = {
            "class_grade": request.data.get("class_grade"),
            "subject": request.data.get("subject"),
            "day": request.data.get("day"),
            "start_time": request.data.get("start_time"),
            "end_time": request.data.get("end_time"),
        }

        # Input validation
        missing_fields = [field for field, value in schedule_data.items() if not value]
        if missing_fields:
            return JsonResponse({"error": f"Missing fields: {', '.join(missing_fields)}"}, status=400)

        try:
            # Insert schedule into MongoDB
            inserted_schedule = schedules.insert_one(schedule_data)
            schedule_data["_id"] = str(inserted_schedule.inserted_id)  # Convert ObjectId to string

            # Return success response
            return JsonResponse(schedule_data, status=201)

        except Exception as e:  # Catch any general exception
            return JsonResponse({"error": f"Database error: {str(e)}"}, status=500)

# List schedules (GET)
class ListSchedulesView(APIView):
    def get(self, request):
        class_grade = request.query_params.get('class_grade')
        schedules = get_schedules_collection()

        query = {} if not class_grade else {'class_grade': int(class_grade)}
        try:
            # Fetch the list of schedules from MongoDB
            schedule_list = list(schedules.find(query))

            # Convert _id to string for each schedule
            for schedule in schedule_list:
                schedule["_id"] = str(schedule["_id"])

            return Response(schedule_list, status=200)

        except Exception as e:  # Catch any general exception
            return JsonResponse({"error": f"Database error: {str(e)}"}, status=500)

# Admin delete schedule (DELETE)
class AdminDeleteScheduleView(APIView):
    def delete(self, request, schedule_id):
        try:
            # Validate ObjectId format
            if not ObjectId.is_valid(schedule_id):
                return HttpResponseBadRequest("❌ Invalid schedule ID format.")

            schedules = get_schedules_collection()

            # Attempt to delete the schedule by ID
            result = schedules.delete_one({"_id": ObjectId(schedule_id)})

            if result.deleted_count > 0:
                return JsonResponse({"message": f"✅ Schedule with ID {schedule_id} deleted successfully."}, status=200)
            else:
                return JsonResponse({"message": "❌ Schedule not found."}, status=404)

        except Exception as e:  # Catch any general exception
            return JsonResponse({"error": f"Database error: {str(e)}"}, status=500)
        except Exception as e:
            return JsonResponse({"error": f"Unexpected error: {str(e)}"}, status=500)



#        ---------------------------------STUDENT SIDE----------------------------------------


# ------------------- STUDENT LOGIN -------------------

class StudentLoginView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response({'error': 'Username and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        student = get_students_collection().find_one({'username': username})

        if student and password == student['password']:
            return Response({
                'id': str(student['_id']),
                'username': student['username'],
                'class_grade': student['class_grade']
            })
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

# ------------------- STUDENT PROFILE -------------------

class StudentProfileView(APIView):
    def get(self, request):
        student_id = request.GET.get("student_id")
        if not student_id:
            return Response({"error": "Student ID is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            student = get_students_collection().find_one({"_id": ObjectId(student_id)})
        except Exception:
            return Response({"error": "Invalid Student ID"}, status=status.HTTP_400_BAD_REQUEST)

        if student:
            return Response({
                "id": str(student["_id"]),
                "name": student.get("name", ""),
                "username": student.get("username", ""),
                "class_grade": student.get("class_grade", "")
            })
        return Response({"error": "Student not found"}, status=status.HTTP_404_NOT_FOUND)

# ------------------- ASSIGNMENT LIST -------------------

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

        assignments = get_assignments_collection().find({"class_grade": class_grade})
        result = [{**a, "_id": str(a["_id"])} for a in assignments]
        return Response(result)

# ------------------- SUBMIT ASSIGNMENT -------------------

class StudentSubmitAssignmentView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        required_fields = ["student_name", "class", "assignment_title", "due_date"]
        if not all(request.data.get(field) for field in required_fields) or 'file' not in request.FILES:
            return Response({"error": "All fields are required."}, status=status.HTTP_400_BAD_REQUEST)

        file = request.FILES["file"]
        extension = file.name.split(".")[-1].lower()
        if extension not in ["pdf", "docx"]:
            return Response({"error": "Only PDF and DOCX files are allowed."}, status=status.HTTP_400_BAD_REQUEST)

        if file.size > 10 * 1024 * 1024:
            return Response({"error": "File too large. Max size is 10MB."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            datetime.datetime.strptime(request.data["due_date"], "%Y-%m-%d")
        except ValueError:
            return Response({"error": "Invalid due_date format. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            upload_result = cloudinary.uploader.upload(
                file,
                folder="assignments",
                use_filename=True,
                unique_filename=False,
                resource_type="auto"
            )
            viewable_url = upload_result.get("secure_url")
            download_url = viewable_url.replace("/upload/", "/upload/fl_attachment/")
        except Exception as e:
            return Response({"error": "Cloudinary upload failed.", "details": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        submission_data = {
            "student_name": request.data["student_name"],
            "class": request.data["class"],
            "assignment_title": request.data["assignment_title"],
            "due_date": request.data["due_date"],
            "filename": file.name,
            "file_url": viewable_url,
            "viewable_url": viewable_url,
            "download_url": download_url,
            "content_type": file.content_type,
            "submitted_at": datetime.datetime.utcnow().isoformat(),
            "status": "Pending"
        }

        try:
            get_submissions_collection().insert_one(submission_data)
        except Exception as e:
            return Response({"error": "Failed to save submission.", "details": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            "message": "Assignment submitted successfully",
            "viewable_url": viewable_url,
            "download_url": download_url
        }, status=status.HTTP_201_CREATED)

# ------------------- VIDEO LECTURES -------------------

class StudentListVideosLecturesView(APIView):
    def get(self, request):
        class_grade = request.query_params.get('class_grade')
        try:
            query = {'class_grade': int(class_grade)} if class_grade else {}
        except ValueError:
            return Response({"error": "Invalid class_grade format."}, status=status.HTTP_400_BAD_REQUEST)

        videos = get_videos_lectures_collection().find(query)
        result = [{"id": str(v["_id"]), **{k: v[k] for k in v if k != "_id"}} for v in videos]
        return Response(result)

# ------------------- QUERY SUBMISSION -------------------

class StudentQueryView(APIView):
    def post(self, request):
        data = request.data
        if not all([data.get("studentName"), data.get("class_grade"), data.get("query")]):
            return Response({"error": "All fields are required."}, status=status.HTTP_400_BAD_REQUEST)

        new_query = {
            "studentName": data["studentName"],
            "class_grade": int(data["class_grade"]),
            "query": data["query"]
        }

        result = get_queries_collection().insert_one(new_query)
        return Response({"message": "Query uploaded successfully", "query_id": str(result.inserted_id)}, status=status.HTTP_201_CREATED)

# ------------------- CLASS SCHEDULE -------------------

class StudentScheduleView(APIView):
    def get(self, request):
        class_grade = request.query_params.get('class_grade')
        if not class_grade:
            return Response({"error": "Class grade is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            query = {'class_grade': int(class_grade)}
            schedules = get_schedules_collection().find(query)
            result = [{**s, "_id": str(s["_id"])} for s in schedules]
            return Response(result)
        except Exception as e:
            return Response({"error": "Failed to fetch schedule.", "details": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
