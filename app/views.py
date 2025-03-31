# app/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from django.http import JsonResponse, HttpResponseBadRequest
from bson import ObjectId # ✅ Required to handle MongoDB ObjectId
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from django.views import View
import bcrypt
from django.http import JsonResponse
import datetime
import json
from .db import (
    get_students_collection, get_admins_collection, get_assignments_collection,get_submissions_collection,
    get_schedules_collection, get_videos_lectures_collection,get_queries_collection
)


#-----admin----

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

class ListSubmissionsView(APIView):
    def get(self, request):
        class_grade = request.query_params.get("class_grade")
        submissions = get_submissions_collection()

        query = {} if not class_grade else {"class_grade": int(class_grade)}
        submission_list = list(submissions.find(query, {"_id": 1, "student_name": 1, "class_grade": 1, "title": 1, "submission_file": 1, "submitted_on": 1, "status": 1}))

        for submission in submission_list:
            submission["_id"] = str(submission["_id"])  # Convert ObjectId to string

        return Response(submission_list, status=status.HTTP_200_OK)

class AdminUpdateSubmissionView(APIView):
    def patch(self, request, submission_id):
        try:
            submissions = get_submissions_collection()
            update_data = request.data

            if not update_data.get("status"):
                return JsonResponse({"error": "❌ 'status' field is required."}, status=400)

            # ✅ Handle both ObjectId and UUID formats
            if ObjectId.is_valid(submission_id):
                query = {"_id": ObjectId(submission_id)}
            else:
                query = {"_id": submission_id}  # If stored as UUID, use string

            result = submissions.update_one(query, {"$set": {"status": update_data["status"]}})

            if result.modified_count > 0:
                return JsonResponse({"message": "✅ Submission status updated successfully."}, status=200)
            else:
                return JsonResponse({"error": "❌ Submission not found or already updated."}, status=404)

        except Exception as e:
            print("❌ Error in AdminUpdateSubmissionView:", str(e))
            return JsonResponse({"error": str(e)}, status=500)

class AdminDeleteSubmissionView(APIView):
    def delete(self, request, submission_id):
        try:
            submissions = get_submissions_collection()

            # ✅ Try to handle both ObjectId and UUID formats
            if ObjectId.is_valid(submission_id):
                query = {"_id": ObjectId(submission_id)}
            else:
                query = {"_id": submission_id}  # If stored as UUID, use string

            result = submissions.delete_one(query)

            if result.deleted_count > 0:
                return JsonResponse({"message": f"✅ Submission {submission_id} deleted."}, status=200)
            else:
                return JsonResponse({"error": "❌ Submission not found."}, status=404)

        except Exception as e:
            print("❌ Error in AdminDeleteSubmissionView:", str(e))
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
        password = request.data.get('password').encode('utf-8')
        students = get_students_collection()
        
        student = students.find_one({'username': username})
        if student and bcrypt.checkpw(password, student['password'].encode('utf-8')):
            student_data = {
                'id': str(student['_id']),
                'username': student['username'],
                'class_grade': student['class_grade']
            }
            return Response(student_data)
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

class StudentListAssignmentsView(APIView):
    def get(self, request):
        class_grade = int(request.query_params.get('class_grade'))
        assignments = get_assignments_collection()
        assignment_list = list(assignments.find({'class_grade': class_grade}))
        for assignment in assignment_list:
            assignment['id'] = str(assignment['_id'])
            del assignment['_id']
        return Response(assignment_list)

class StudentSubmitAssignmentView(APIView):
    def post(self, request):
        submissions = get_submissions_collection()

        student_name = request.data.get("student_name")
        class_grade = request.data.get("class_grade")
        title = request.data.get("title")
        submission_file = request.data.get("submission_file")

        if not student_name or not class_grade or not title or not submission_file:
            return Response({"error": "All fields are required"}, status=status.HTTP_400_BAD_REQUEST)

        submission_data = {
            "student_name": student_name,
            "class_grade": int(class_grade),
            "title": title,
            "submission_file": submission_file,
            "submitted_on": datetime.datetime.utcnow(),
            "status": "Pending"  # Default status
        }

        inserted_submission = submissions.insert_one(submission_data)
        submission_data["_id"] = str(inserted_submission.inserted_id)

        return JsonResponse(submission_data, safe=False, status=201)

class StudentListVideosLecturesView(APIView):
    def get(self, request):
        class_grade = int(request.query_params.get('class_grade'))
        videos_lectures = get_videos_lectures_collection()
        video_list = list(videos_lectures.find({'class_grade': class_grade}))
        for video in video_list:
            video['id'] = str(video['_id'])
            del video['_id']
        return Response(video_list)

class StudentQueryView(APIView):
    def post(self, request):
        try:
            student_name = request.data.get("studentName")
            class_grade = request.data.get("class_grade")
            query = request.data.get("query")

            if not student_name or not class_grade or not query:
                return Response({"error": "Missing required fields"}, status=status.HTTP_400_BAD_REQUEST)

            class_grade = int(class_grade)

            # ✅ Validate class_grade range
            if class_grade < 1 or class_grade > 10:
                return Response({"error": "Class grade must be between 1 and 10"}, status=status.HTTP_400_BAD_REQUEST)

            queries_collection = get_queries_collection()

            student_query = {
                "studentName": student_name,
                "class_grade": class_grade,
                "query": query,
                "submitted_at": datetime.datetime.now().isoformat()
            }

            queries_collection.insert_one(student_query)

            return Response({"message": "Query submitted successfully!"}, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class StudentScheduleView(APIView):
    def get(self, request):
        class_grade = int(request.query_params.get('class_grade'))
        schedules = get_schedules_collection()
        schedule_list = list(schedules.find({'class_grade': class_grade}))
        for schedule in schedule_list:
            schedule['id'] = str(schedule['_id'])
            del schedule['_id']
        return Response(schedule_list)