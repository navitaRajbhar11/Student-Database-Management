import React, { useState, useCallback } from "react";
import { View, Text, FlatList, Pressable, StyleSheet, RefreshControl } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faFolder } from "@fortawesome/free-solid-svg-icons";

type ChapterContent = {
  videos: { title: string; video_url: string }[];
  pdfs: { title: string; pdf_url: string }[];
};

type SubjectChaptersScreenProps = {
  route: {
    params: {
      subject: string;
      chapters: Record<string, ChapterContent>;
    };
  };
};

type RootStackParamList = {
  ChapterScreen: {
    subject: string;
    chapter: string;
    content: ChapterContent;
  };
};

const SubjectChaptersScreen: React.FC<SubjectChaptersScreenProps> = ({ route }) => {
  const { subject, chapters } = route.params;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000); // Simulate quick refresh
  }, []);

  const handleChapterPress = (chapter: string) => {
    navigation.navigate("ChapterScreen", {
      subject,
      chapter,
      content: chapters[chapter],
    });
  };

  const renderChapter = ({ item }: { item: string }) => (
    <Pressable style={styles.chapterButton} onPress={() => handleChapterPress(item)}>
      <FontAwesomeIcon icon={faFolder} size={20} color="#fff" style={styles.icon} />
      <Text style={styles.chapterText}>{item}</Text>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{subject} - Chapters</Text>
      <FlatList
        data={Object.keys(chapters)}
        renderItem={renderChapter}
        keyExtractor={(item) => item}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F4FF",
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 30,
    color: "#1E293B",
  },
  chapterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 15,
    backgroundColor: "#3B82F6",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  chapterText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "500",
    flex: 1,
  },
  icon: {
    marginRight: 15,
  },
});

export default SubjectChaptersScreen;
