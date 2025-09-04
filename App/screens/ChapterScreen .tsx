import React, { useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Linking,
} from "react-native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faPlay, faFilePdf } from "@fortawesome/free-solid-svg-icons";
import { useNavigation } from "@react-navigation/native";

type ChapterContent = {
  videos: { title: string; video_url: string; description?: string }[];
  pdfs: { title: string; pdf_url: string; description?: string }[];
};

type ChapterScreenProps = {
  route: {
    params: {
      subject: string;
      chapter: string;
      content: ChapterContent;
    };
  };
};

const ChapterScreen: React.FC<ChapterScreenProps> = ({ route }) => {
  const { subject, chapter, content } = route.params;
  const navigation = useNavigation<any>();

  const handleVideoClick = useCallback(
    (videoUrl: string, title: string) => {
      navigation.navigate("LectureViewer", {
        title,
        url: videoUrl,
        type: "video",
        relatedVideos: content.videos, // ✅ Pass related videos here
      });
    },
    [navigation, content.videos]
  );

  const handlePdfClick = useCallback((pdfUrl: string) => {
    Linking.openURL(pdfUrl);
  }, []);

  const renderItemBox = (
    icon: any,
    title: string,
    description: string | undefined,
    actionLabel: string | null,
    onPress: () => void
  ) => (
    <Pressable onPress={onPress} style={styles.itemBox}>
      <View style={styles.row}>
        <FontAwesomeIcon icon={icon} size={22} style={styles.icon} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          {description && <Text style={styles.description}>{description}</Text>}
          {actionLabel && <Text style={styles.actionLabel}>{actionLabel}</Text>}
        </View>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        {subject} / {chapter}
      </Text>

      <Text style={styles.sectionTitle}>Videos</Text>
      {content.videos.length === 0 ? (
        <Text style={styles.empty}>No videos available.</Text>
      ) : (
        <FlatList
          data={content.videos}
          keyExtractor={(item) => item.title}
          renderItem={({ item }) =>
            renderItemBox(
              faPlay,
              item.title,
              item.description,
              null,
              () => handleVideoClick(item.video_url, item.title)
            )
          }
        />
      )}

      <Text style={styles.sectionTitle}>PDFs</Text>
      {content.pdfs.length === 0 ? (
        <Text style={styles.empty}>No PDFs available.</Text>
      ) : (
        <FlatList
          data={content.pdfs}
          keyExtractor={(item) => item.title}
          renderItem={({ item }) =>
            renderItemBox(
              faFilePdf,
              item.title,
              item.description,
              "Open PDF",
              () => handlePdfClick(item.pdf_url)
            )
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#ffffff",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#1E293B",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 25,
    marginBottom: 15,
    color: "#1F2937",
  },
  itemBox: {
    padding: 16,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  icon: {
    marginTop: 4,
    color: "#3B82F6",
  },
  title: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
  },
  description: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  actionLabel: {
    fontSize: 14,
    color: "#2563EB",
    fontWeight: "bold",
    textDecorationLine: "underline",
    marginTop: 4,
  },
  empty: {
    fontSize: 16,
    fontStyle: "italic",
    color: "#9CA3AF",
    marginBottom: 10,
  },
});

export default ChapterScreen;
