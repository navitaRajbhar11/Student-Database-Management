from django.urls import path
from .views import (
    CreateStudentView,
    StudentLoginView,
    AdminDeleteStudentView,
    AdminCreateAssignmentView,
    AdminListAssignmentView,
    AdminDeleteAssignmentView,
    StudentListAssignmentsView,
    StudentSubmitAssignmentView,
    VideoCreateView,
    VideoDeleteView,
    VideoListView,
    ListSubjectsByClassView,
    ChapterDeleteView,
    AdminUpdateSubmissionView,
    StudentListVideosLecturesView,
    ListStudentsView,
    ListSubmissionsView,
    AdminDeleteSubmissionView,
    CreateScheduleView,
    ListSchedulesView,
    StudentScheduleView,
    AdminDeleteScheduleView, 
    AdminLoginView,
    AdminViewQueries,
    AdminDeleteQuery,
    StudentQueryView,
    StudentProfileView
)

urlpatterns = [
    # **Admin Endpoints**
    path('admin/login/', AdminLoginView.as_view(), name='admin-login'),
    path('admin/create-student/', CreateStudentView.as_view(), name='create_student'),  # Student Record Creation
    path('admin/views-student/', ListStudentsView.as_view(), name='views_student'),  # View Student Records
    path('admin/delete-student/<str:student_id>/', AdminDeleteStudentView.as_view(), name='delete-student'),  # Delete Student Record
    path('admin/create-assignment/', AdminCreateAssignmentView.as_view(), name='create_assignment'),  # Create Assignment
    path('admin/delete-assignment/<str:assignment_id>/', AdminDeleteAssignmentView.as_view(), name='delete_assignment'),  # Delete Assignment
    path('admin/list-assignment/', AdminListAssignmentView.as_view(), name='list_assignment'),  # List Assignments
    path("admin/list-submissions/", ListSubmissionsView.as_view(), name="list_submissions"),  # List Submissions
    path("admin/update-submission-status/<str:submission_id>/", AdminUpdateSubmissionView.as_view(), name="update_submission_status"),
    
    # **Video Management (Admin)**
    path('admin/create-videos/', VideoCreateView.as_view(), name='video-create'),  # Create Video
    path('admin/videos/delete/', VideoDeleteView.as_view(), name='video-delete'),  # Delete Video
    path('admin/list-videos/', VideoListView.as_view(), name='video-list'),  # List Videos

    # **Chapter and Subject Management**
    path('admin/chapters/<str:class_name>/<str:subject>/<str:chapter>/', ChapterDeleteView.as_view(), name='chapter-delete'),  # Delete Chapter
    path('admin/subjects/', ListSubjectsByClassView.as_view(), name='list-subjects-by-class'),  # List Subjects by Class

    # **Schedule Management (Admin)**
    path('admin/create-schedule/', CreateScheduleView.as_view(), name='create_schedule'),  # Create Schedule
    path("admin/list-schedule/", ListSchedulesView.as_view(), name="list_schedule"),  # List Schedules
    path('admin/delete-schedule/<str:schedule_id>/', AdminDeleteScheduleView.as_view(), name='delete_schedule'),  # Delete Schedule

    # **Queries Management (Admin)**
    path("admin/view-queries/", AdminViewQueries.as_view(), name="view_queries"),  # View Queries
    path("admin/delete-query/<str:query_id>/", AdminDeleteQuery.as_view(), name="delete_query"),  # Delete Query
    
    # **Student Endpoints**
    path('student/login/', StudentLoginView.as_view(), name='student-login'),  # Student Login
    path('student/profile/', StudentProfileView.as_view(), name='student-profile'),  # Student Profile
    path('student/list-assignments/', StudentListAssignmentsView.as_view(), name='list_assignments'),  # List Assignments
    path('student/submit-assignment/', StudentSubmitAssignmentView.as_view(), name='submit_assignment'),  # Submit Assignment
    path('student/lectures/', StudentListLecturesView.as_view(), name='student-list-lectures'),  # List Lectures
    path('student/lectures/chapters/', StudentListChaptersView.as_view(), name='student-list-chapters'),  # List Chapters
    path('student/lectures/content/', StudentListVideosView.as_view(), name='student-list-videos'),  # List Videos & PDFs
    path('student/schedule/', StudentScheduleView.as_view(), name='student-schedule'),  # Student Schedule
    path("student/upload-query/", StudentQueryView.as_view(), name="upload_query"),  # Student Query Upload
]
