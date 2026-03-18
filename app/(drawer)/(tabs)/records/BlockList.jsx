import BlockList from "../../eventManagement/records/BlockList";

export default function TabsBlockList() {
  return (
    <BlockList
      studentListPath="/records/StudentsList"
      showTabs={false}
    />
  );
}
