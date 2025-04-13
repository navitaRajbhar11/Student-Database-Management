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
    AdminDeleteVideo,
    AdminCreateVideoLectureView,
    AdminListVideosLecturesView,
    AdminDeleteChapterView
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
    # Admin Endpoints
    path('admin/login/', AdminLoginView.as_view(), name='admin-login'),
    path('admin/create-student/', CreateStudentView.as_view(), name='create_student'),  # StudentRecordCreate.jsx
    path('admin/views-student/', ListStudentsView.as_view(), name='views_student'),  # ViewRecord.jsx
    path('admin/delete-student/<str:student_id>/', AdminDeleteStudentView.as_view(), name='delete-student'),  # delete record
    path('admin/create-assignment/', AdminCreateAssignmentView.as_view(), name='create_assignment'),  # Assignment.jsx
    path('admin/delete-assignment/<str:assignment_id>/', AdminDeleteAssignmentView.as_view(), name='delete_assignment'),  # assignment delete
    path('admin/list-assignment/', AdminListAssignmentView.as_view(), name='list_assignment'),  # AssigbmentList.jsx
    path("admin/list-submissions/", ListSubmissionsView.as_view(), name="list_submissions"),  # SListSubmission
    path("admin/update-submission-status/<str:submission_id>/", AdminUpdateSubmissionView.as_view(), name="update_submission_status"),
    path("admin/delete-submission/<str:submission_id>/", AdminDeleteSubmissionView.as_view(), name="delete_submission"),
    path('admin/create-video-lecture/', AdminCreateVideoLectureView.as_view(), name='create_video_lecture'),  # AdminVideos.jsx
    path('admin/delete-video/<str:video_id>/', AdminDeleteVideo.as_view(), name='delete_video'),
    path('admin/list-videos-lectures/', AdminListVideosLecturesView.as_view(), name='list_videos_lectures'),  # ListVideos.jsx
    path('admin/delete-video-lecture/', AdminDeleteChapterView.as_view(), name='delete_video_lecture'),
    path('admin/create-schedule/', CreateScheduleView.as_view(), name='create_schedule'),  # CreateSchedule.jsx
    path("admin/list-schedule/", ListSchedulesView.as_view(), name="list_schedule"),
    path('admin/delete-schedule/<str:schedule_id>/', AdminDeleteScheduleView.as_view(), name='delete_schedule'),
    path("admin/view-queries/", AdminViewQueries.as_view(), name="view_queries"),
    path("admin/delete-query/<str:query_id>/", AdminDeleteQuery.as_view(), name="delete_query"),

    # Student Endpoints
    path('student/login/', StudentLoginView.as_view(), name='student_login'),
    path('student/profile/', StudentProfileView.as_view(), name='student-profile'),
    path('student/list-assignments/', StudentListAssignmentsView.as_view(), name='list_assignments'),
    path('student/submit-assignment/', StudentSubmitAssignmentView.as_view(), name='submit_assignment'),
    path('student/list-videos-lectures/', StudentListVideosLecturesView.as_view(), name='list_videos_lectures'),
    path('student/schedule/', StudentScheduleView.as_view(), name='student_schedule'), 
    path("student/upload-query/", StudentQueryView.as_view(), name="upload_query"),
]
