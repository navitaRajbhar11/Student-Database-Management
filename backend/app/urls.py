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
    StudentListLecturesView,
    StudentListChaptersView,
    StudentListVideosView,
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
    path('admin/create-student/', CreateStudentView.as_view(), name='create_student'),
    path('admin/views-student/', ListStudentsView.as_view(), name='views_student'),
    path('admin/delete-student/<str:student_id>/', AdminDeleteStudentView.as_view(), name='delete-student'),
    path('admin/create-assignment/', AdminCreateAssignmentView.as_view(), name='create_assignment'),
    path('admin/delete-assignment/<str:assignment_id>/', AdminDeleteAssignmentView.as_view(), name='delete_assignment'),
    path('admin/list-assignment/', AdminListAssignmentView.as_view(), name='list_assignment'),
    path("admin/list-submissions/", ListSubmissionsView.as_view(), name="list_submissions"),
    path("admin/update-submission-status/<str:submission_id>/", AdminUpdateSubmissionView.as_view(), name="update_submission_status"),
    
    # **Video Management (Admin)**
    path('admin/create-videos/', VideoCreateView.as_view(), name='video-create'),
    path('admin/videos/delete/<str:video_id>/', VideoDeleteView.as_view(), name='video-delete'),
    path('admin/list-videos/', VideoListView.as_view(), name='video-list'),

    # **Chapter and Subject Management**
    path('admin/chapters/<str:class_name>/<str:subject>/<str:chapter>/', ChapterDeleteView.as_view(), name='chapter-delete'),
    path('admin/subjects/', ListSubjectsByClassView.as_view(), name='list-subjects-by-class'),

    # **Schedule Management (Admin)**
    path('admin/create-schedule/', CreateScheduleView.as_view(), name='create_schedule'),
    path("admin/list-schedule/", ListSchedulesView.as_view(), name="list_schedule"),
    path('admin/delete-schedule/<str:schedule_id>/', AdminDeleteScheduleView.as_view(), name='delete_schedule'),

    # **Queries Management (Admin)**
    path("admin/view-queries/", AdminViewQueries.as_view(), name="view_queries"),
    path("admin/delete-query/<str:query_id>/", AdminDeleteQuery.as_view(), name="delete_query"),
    
    # **Student Endpoints**
    path('student/login/', StudentLoginView.as_view(), name='student-login'),
    path('student/profile/', StudentProfileView.as_view(), name='student-profile'),
    path('student/list-assignments/', StudentListAssignmentsView.as_view(), name='list_assignments'),
    path('student/submit-assignment/', StudentSubmitAssignmentView.as_view(), name='submit_assignment'),
    path('student/lectures/', StudentListLecturesView.as_view(), name='student-list-lectures'),
    path('student/lectures/chapters/<str:subject>/', StudentListChaptersView.as_view(), name='student-list-chapters'),
    path('student/lectures/content/', StudentListVideosView.as_view(), name='student-list-videos'),
    path('student/schedule/', StudentScheduleView.as_view(), name='student-schedule'),
    path("student/upload-query/", StudentQueryView.as_view(), name="upload_query"),
]
