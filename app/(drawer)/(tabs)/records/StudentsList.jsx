import StudentsList from "../../eventManagement/records/StudentsList";

export default function TabsStudentsList() {
  return (
    <StudentsList
      attendancePath="/records/Attendance"
      showTabs={false}
    />
  );
}
