# app/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from django.http import JsonResponse, HttpResponseBadRequest
from bson import ObjectId # ✅ Required to handle MongoDB ObjectId
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from bson.objectid import ObjectId
from rest_framework.parsers import MultiPartParser, FormParser
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
from google.oauth2 import service_account
import io, os, datetime
from django.conf import settings
from django.views import View
from bson import Binary
from urllib.parse import urljoin
from urllib.parse import urlparse
import datetime
import uuid
import json
VALID_CLASS_GRADES = [
    "11th", "12th", "FY BCom", "SY BCom", "TY BCom", 
    "CA Foundation", "CA Intermediate", "CA Final"
]
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
        name = request.data.get("name")
        username = request.data.get("username")
        password = request.data.get("password")
        class_grade = request.data.get("class_grade")

        # Validate the input fields
        if not name or not username or not password or not class_grade:
            return Response({'error': 'All fields are required'}, status=status.HTTP_400_BAD_REQUEST)

        # Validate class_grade
        if class_grade not in VALID_CLASS_GRADES:
            return Response({'error': 'Invalid class_grade. Must be one of: ' + ', '.join(VALID_CLASS_GRADES)},
                             status=status.HTTP_400_BAD_REQUEST)

        # Check if username already exists
        students = get_students_collection()
        if students.find_one({"username": username}):
            return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)

        # Create new student record
        student = {
            "name": name,
            "username": username,
            "password": password,
            "class_grade": class_grade,
            "created_at": datetime.datetime.now().isoformat(),
        }

        # Insert the student into the collection
        result = students.insert_one(student)

        return Response({
            'id': str(result.inserted_id),
            'name': name,
            'username': username,
            'class_grade': class_grade
        }, status=status.HTTP_201_CREATED)

class ListStudentsView(APIView):
    def get(self, request):
        class_grade = request.query_params.get('class_grade')  # Get class_grade from query params
        students = get_students_collection()

        query = {}
        if class_grade:
            if class_grade not in VALID_CLASS_GRADES:
                return Response({'error': 'Invalid class_grade.'}, status=400)
            query["class_grade"] = class_grade  # Apply the class filter if provided

        student_list = list(students.find(query))  # Fetch students based on the query
        for student in student_list:
            student["id"] = str(student["_id"])  # Convert ObjectId to string
            del student["_id"]  # Remove the ObjectId field

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

        query_filter = {"class_grade": class_grade} if class_grade else {}

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
        class_grade = request.data.get("class_grade")
        title = request.data.get("title")
        description = request.data.get("description")
        due_date = request.data.get("due_date")

        if not all([class_grade, title, description, due_date]):
            return Response({"error": "All fields are required"}, status=400)

        if class_grade not in VALID_CLASS_GRADES:
            return Response({"error": "Invalid class_grade"}, status=400)

        assignments = get_assignments_collection()
        data = {
            "class_grade": class_grade,
            "title": title,
            "description": description,
            "due_date": due_date,
            "created_at": datetime.datetime.now().isoformat(),
        }

        result = assignments.insert_one(data)
        data["_id"] = str(result.inserted_id)
        return Response(data, status=201)

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
        class_grade = request.query_params.get("class_grade")
        query = {}

        if class_grade:
            if class_grade not in VALID_CLASS_GRADES:
                return Response({"error": "Invalid class_grade"}, status=400)
            query["class_grade"] = class_grade

        assignments = get_assignments_collection()
        results = list(assignments.find(query))
        for r in results:
            r["_id"] = str(r["_id"])

        return Response(results, status=200)

#-----Submission-------

BASE_URL = "https://student-backend-8oa3.onrender.com"  # Used only for local files, not Cloudinary


class ListSubmissionsView(APIView):
    def get(self, request):
        class_grade = request.query_params.get("class_grade")
        submissions_collection = get_submissions_collection()

        if class_grade and class_grade not in VALID_CLASS_GRADES:
            return Response({'error': 'Invalid class_grade.'}, status=400)

        # ✅ Fix field name from 'class' to 'class_grade'
        query = {"class_grade": class_grade} if class_grade else {}

        submission_list = list(submissions_collection.find(query).sort("submitted_at", -1))

        formatted_submissions = []

        for submission in submission_list:
            submitted_at = submission.get("submitted_at")
            if isinstance(submitted_at, datetime.datetime):
                submitted_at = submitted_at.isoformat()

            raw_file_url = submission.get("file_url", "")
            full_file_url = raw_file_url if raw_file_url.startswith("http") else urljoin(BASE_URL, raw_file_url)

            formatted = {
                "_id": str(submission.get("_id", "")),
                "student_name": submission.get("student_name", ""),
                "class": submission.get("class_grade", ""),  # ✅ fixed here
                "assignment_title": submission.get("assignment_title", ""),
                "filename": submission.get("filename", ""),
                "file_url": full_file_url,
                "viewable_url": full_file_url,
                "download_url": full_file_url,
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

            # Ensure status is provided and valid
            if not update_data.get("status"):
                return JsonResponse({"error": "'status' field is required."}, status=400)

            # Validate the class grade (if you want to enforce the validation here too)
            valid_classes = [
                "11th", "12th", "FY BCom", "SY BCom", "TY BCom", 
                "CA Foundation", "CA Intermediate", "CA Final"
            ]
            if update_data.get("class_grade") and update_data["class_grade"] not in valid_classes:
                return JsonResponse({"error": "Invalid class_grade."}, status=400)

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

class VideoCreateView(APIView):
    def post(self, request):
        data = request.data
        required_fields = ["class", "subject", "chapter"]

        for field in required_fields:
            if field not in data or not data[field]:
                return Response({"error": f"{field} is required"}, status=400)

        videos = data.get("videos", [])
        if not videos or not isinstance(videos, list):
            return Response({"error": "At least one video is required"}, status=400)

        collection = get_videos_lectures_collection()

        existing_doc = collection.find_one({
            "class": data["class"],
            "subject": data["subject"],
            "chapter": data["chapter"]
        })

        for video in videos:
            if not video.get("video_name") or not video.get("video_url"):
                return Response({"error": "Each video must have a name and URL"}, status=400)

            # Validate URL
            try:
                result = urlparse(video["video_url"])
                if not all([result.scheme, result.netloc]):
                    raise ValueError("Invalid video URL")
            except ValueError:
                return Response({"error": "Invalid video URL format"}, status=400)

        if existing_doc:
            # Check for duplicates
            existing_video_names = [v["video_name"] for v in existing_doc["videos"]]
            for video in videos:
                if video["video_name"] in existing_video_names:
                    return Response({"error": f"Duplicate video name: {video['video_name']}"}, status=400)

            # Push all videos
            collection.update_one(
                {"_id": existing_doc["_id"]},
                {"$push": {"videos": {"$each": videos}}}
            )
        else:
            collection.insert_one({
                "class": data["class"],
                "subject": data["subject"],
                "chapter": data["chapter"],
                "videos": videos,
                "created_at": datetime.datetime.utcnow()
            })

        return Response({"message": "Videos added successfully"}, status=201)

class VideoDeleteView(APIView):
    def delete(self, request):
        data = request.data
        collection = get_videos_lectures_collection()

        result = collection.update_one(
            {
                "class": data["class"],
                "subject": data["subject"],
                "chapter": data["chapter"]
            },
            {
                "$pull": {
                    "videos": {
                        "video_name": data["video_name"]
                    }
                }
            }
        )

        if result.modified_count:
            return Response({"message": "Video deleted"}, status=200)
        return Response({"error": "Video not found"}, status=404)

class ChapterDeleteView(APIView):
    def delete(self, request, class_name, subject, chapter):
        collection = get_videos_lectures_collection()
        result = collection.delete_one({
            "class": class_name,
            "subject": subject,
            "chapter": chapter
        })

        if result.deleted_count:
            return Response({"message": "Chapter deleted"}, status=200)
        return Response({"error": "Chapter not found"}, status=404)

class VideoListView(APIView):
    def get(self, request):
        selected_class = request.GET.get("class")
        selected_subject = request.GET.get("subject")
        selected_chapter = request.GET.get("chapter")

        if not selected_class:
            return Response({"error": "Class is required"}, status=400)

        # ✅ Call the collection function properly
        collection = get_videos_lectures_collection()

        query = {"class": selected_class}
        if selected_subject:
            query["subject"] = selected_subject
        if selected_chapter:
            query["chapter"] = selected_chapter

        data = list(collection.find(query))

        if not data:
            return Response({"message": "No videos found for the given filters."}, status=404)

        response = {}
        for doc in data:
            subject = doc.get("subject")
            chapter = doc.get("chapter")
            videos = doc.get("videos", [])

            if subject not in response:
                response[subject] = {}

            if chapter not in response[subject]:
                response[subject][chapter] = []

            response[subject][chapter].extend(videos)

        return Response(response, status=200)

class ListSubjectsByClassView(APIView):
    def get(self, request):
        class_name = request.query_params.get('class')
        if not class_name:
            return Response({'error': 'Class is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Fetch the collection
        collection = get_videos_lectures_collection()

        # Get distinct subjects for the selected class
        subjects = collection.distinct('subject', {'class': class_name})

        return Response({'subjects': subjects}, status=status.HTTP_200_OK)



#------Schedule---
class CreateScheduleView(APIView):
    def post(self, request):
        schedules = get_schedules_collection()
        class_grade = request.data.get("class_grade")

        if class_grade not in VALID_CLASS_GRADES:
            return JsonResponse({"error": "Invalid class_grade."}, status=400)

        schedule_data = {
            "class_grade": class_grade,
            "subject": request.data.get("subject"),
            "day": request.data.get("day"),
            "start_time": request.data.get("start_time"),
            "end_time": request.data.get("end_time"),
        }

        inserted = schedules.insert_one(schedule_data)
        schedule_data["_id"] = str(inserted.inserted_id)

        return JsonResponse(schedule_data, safe=False, status=201)

class ListSchedulesView(APIView):
    def get(self, request):
        class_grade = request.query_params.get('class_grade')
        query = {}

        if class_grade:
            if class_grade not in VALID_CLASS_GRADES:
                return Response({'error': 'Invalid class_grade.'}, status=400)
            query["class_grade"] = class_grade

        schedules = get_schedules_collection()
        schedule_list = list(schedules.find(query))

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
    VALID_CLASS_GRADES = {
        "11th": "11th",
        "12th": "12th",
        "FY BCom": "FY BCom",
        "SY BCom": "SY BCom",
        "TY BCom": "TY BCom",
        "CA Foundation": "CA Foundation",
        "CA Intermediate": "CA Intermediate",
        "CA Final": "CA Final"
    }

    def get(self, request):
        student_id = request.query_params.get("student_id")

        if not student_id:
            return Response({"error": "Student ID is required"}, status=status.HTTP_400_BAD_REQUEST)

        students_collection = get_students_collection()

        try:
            # Check if the student_id is a valid ObjectId
            student_id = ObjectId(student_id)
        except Exception as e:
            return Response({"error": "Invalid Student ID format"}, status=status.HTTP_400_BAD_REQUEST)

        # Try to fetch the student from the database
        student = students_collection.find_one({"_id": student_id})

        if student:
            raw_grade = student.get("class_grade", "")
            class_grade = self.VALID_CLASS_GRADES.get(raw_grade, raw_grade)

            student_data = {
                "id": str(student["_id"]),
                "name": student.get("name", ""),
                "username": student.get("username", ""),
                "class_grade": class_grade,
            }
            return Response(student_data, status=status.HTTP_200_OK)

        return Response({"error": "Student not found"}, status=status.HTTP_404_NOT_FOUND)

class StudentListAssignmentsView(APIView):
    def get(self, request):
        student_id = request.query_params.get("student_id")
        class_grade = request.query_params.get("class_grade")

        if not student_id or not class_grade:
            return Response({"error": "Student ID and class_grade are required."}, status=status.HTTP_400_BAD_REQUEST)

        # Class grade should be a string, so no need to convert it to an integer
        VALID_CLASS_GRADES = [
            "11th", "12th", "FY BCom", "SY BCom", "TY BCom", 
            "CA Foundation", "CA Intermediate", "CA Final"
        ]
        if class_grade not in VALID_CLASS_GRADES:
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
        student_name = request.data.get("student_name")
        student_class = request.data.get("class_grade")
        assignment_title = request.data.get("assignment_title")
        due_date = request.data.get("due_date")
        file = request.FILES.get("file")

        # Basic field validation
        if not all([student_name, student_class, assignment_title, due_date, file]):
            return JsonResponse({"error": "All fields are required"}, status=400)

        # File validation
        allowed_extensions = ["pdf", "docx"]
        file_extension = file.name.split(".")[-1].lower()
        if file_extension not in allowed_extensions:
            return JsonResponse({"error": "Only PDF and DOCX files allowed"}, status=400)

        if file.size > 1 * 1024 * 1024:  # 1MB limit
            return JsonResponse({"error": "File too large. Max size is 1MB"}, status=400)

        try:
            datetime.datetime.strptime(due_date, "%Y-%m-%d")
        except ValueError:
            return JsonResponse({"error": "Invalid due_date format. Use YYYY-MM-DD."}, status=400)

        # Google Drive integration setup
        SCOPES = ['https://www.googleapis.com/auth/drive']
        SERVICE_ACCOUNT_FILE = settings.GOOGLE_DRIVE_CREDENTIALS_FILE

        # Retry logic for Google Drive upload
        for attempt in range(3):
            try:
                # Load credentials and build the Google Drive service
                credentials = service_account.Credentials.from_service_account_file(
                    SERVICE_ACCOUNT_FILE, scopes=SCOPES
                )
                drive_service = build('drive', 'v3', credentials=credentials)

                PARENT_FOLDER_ID = "1WAPvWKDfCMLk8reA3qQbROQA5Nlw5FgI"  # Replace with your root folder ID

                # Check if folder exists, if not create it
                # 1. List all folders to check if folder for the class exists
                query = f"mimeType = 'application/vnd.google-apps.folder' and name = '{student_class}' and '{PARENT_FOLDER_ID}' in parents"
                results = drive_service.files().list(q=query, fields="files(id, name)").execute()
                folders = results.get('files', [])

                if folders:
                    # If folder exists, get the first matching folder's ID
                    class_folder = folders[0]['id']
                else:
                    # If no folder exists, create a new one
                    metadata = {
                        'name': student_class,
                        'mimeType': 'application/vnd.google-apps.folder',
                        'parents': [PARENT_FOLDER_ID]
                    }
                    folder = drive_service.files().create(body=metadata, fields='id').execute()
                    class_folder = folder['id']

                # Upload the assignment file to the folder
                file_stream = io.BytesIO(file.read())
                media = MediaIoBaseUpload(file_stream, mimetype=file.content_type, resumable=True)
                metadata = {'name': file.name, 'parents': [class_folder]}

                uploaded_file = drive_service.files().create(
                    body=metadata, media_body=media,
                    fields='id,webViewLink,webContentLink'
                ).execute()

                # Get the file URLs for viewing and downloading
                viewable_url = uploaded_file.get('webViewLink')
                download_url = uploaded_file.get('webContentLink')

                break  # Exit loop if successful

            except Exception as e:
                if attempt < 2:
                    time.sleep(2)  # Retry after 2 seconds
                    continue
                print("❌ Google Drive Upload Error:", e)
                return JsonResponse({"error": "Failed to upload to Google Drive"}, status=500)

        # Save the submission in MongoDB
        try:
            submissions = get_submissions_collection()
            submissions.insert_one({
                "student_name": student_name,
                "class_grade": student_class,
                "assignment_title": assignment_title,
                "due_date": due_date,
                "filename": file.name,
                "file_url": viewable_url,
                "viewable_url": viewable_url,
                "download_url": download_url,
                "content_type": file.content_type,
                "submitted_at": datetime.datetime.utcnow().isoformat(),
                "status": "Pending"
            })
        except Exception as e:
            print("❌ MongoDB Insert Error:", e)
            return JsonResponse({"error": "Failed to save submission"}, status=500)

        # Return success message with the URLs
        return JsonResponse({
            "message": "Assignment submitted successfully",
            "viewable_url": viewable_url,
            "download_url": download_url
        }, status=201)


#videos
class StudentListVideosLecturesView(APIView):
    def get(self, request):
        subject = request.GET.get("subject")
        class_grade = request.GET.get("class_grade")

        if not class_grade:
            return Response({"error": "class_grade is required"}, status=status.HTTP_400_BAD_REQUEST)

        collection = get_videos_lectures_collection()

        # Admin side uses "class" instead of "class_grade"
        query = {"class": class_grade}
        if subject:
            query["subject"] = subject

        try:
            data = list(collection.find(query))
        except Exception as e:
            return Response({"error": f"Error fetching data: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        if not data:
            return Response({"message": "No lectures found.", "data": {}}, status=status.HTTP_200_OK)

        # Format the response: subject -> chapter -> videos/pdf
        response = {}

        for doc in data:
            subject_name = doc.get("subject", "Unknown Subject")
            chapter = doc.get("chapter", "Unknown Chapter")
            videos = doc.get("videos", [])

            if subject_name not in response:
                response[subject_name] = {}

            if chapter not in response[subject_name]:
                response[subject_name][chapter] = {
                    "videos": [],
                    "pdfs": []
                }

            for video in videos:
                video_name = video.get("video_name", "Untitled")
                video_url = video.get("video_url", "")
                pdf_url = video.get("pdf_url", "")
                description = video.get("description", "")

                base_data = {
                    "_id": str(doc.get("_id")),
                    "title": video_name,
                    "description": description
                }

                if video_url:
                    response[subject_name][chapter]["videos"].append({
                        **base_data,
                        "video_url": video_url,
                        "pdf_url": "",
                        "type": "video"
                    })

                if pdf_url:
                    response[subject_name][chapter]["pdfs"].append({
                        **base_data,
                        "video_url": "",
                        "pdf_url": pdf_url,
                        "type": "pdf"
                    })

        return Response({"message": "Lectures fetched successfully", "data": response}, status=status.HTTP_200_OK)


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
            "class_grade": class_grade,  # ✅ Now keeping it as a string
            "query": query_text
        }

        try:
            inserted = queries_collection.insert_one(new_query)
        except Exception as e:
            return Response(
                {"error": "Failed to upload query", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

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
            # No int() conversion here
            query = {'class_grade': class_grade}
            schedule_list = list(schedules.find(query))

            for schedule in schedule_list:
                schedule["_id"] = str(schedule["_id"])

            return Response(schedule_list, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": "Failed to fetch schedule.", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
