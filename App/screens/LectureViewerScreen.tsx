import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { WebView } from 'react-native-webview';

type RootStackParamList = {
  LectureViewer: {
    type: 'video' | 'pdf';
    url: string;
    title: string;
    relatedVideos: {
      title: string;
      video_url: string;
      thumbnail?: string;
    }[];
  };
};

type LectureViewerRouteProp = RouteProp<RootStackParamList, 'LectureViewer'>;

const extractYouTubeId = (url: string) => {
  const match = url.match(
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/
  );
  return match ? match[1] : null;
};

const getYouTubeThumbnail = (videoUrl: string) => {
  const videoId = extractYouTubeId(videoUrl);
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
};

const LectureViewerScreen = () => {
  const route = useRoute<LectureViewerRouteProp>();
  const { type, url: initialUrl, relatedVideos } = route.params;

  const [currentUrl, setCurrentUrl] = useState(initialUrl);
  const [errorThumbnails, setErrorThumbnails] = useState<{ [key: string]: boolean }>({});

  const videoId = extractYouTubeId(currentUrl);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          html, body {
            margin: 0;
            padding: 0;
            background-color: black;
            height: 100%;
            overflow: hidden;
          }
          iframe {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border: none;
          }
        </style>
      </head>
      <body>
        <iframe 
          src="https://www.youtube.com/embed/${videoId}?controls=1&modestbranding=1&rel=0&showinfo=0&fs=1" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      </body>
    </html>
  `;

  const renderRelatedVideo = ({ item }: { item: typeof relatedVideos[0] }) => {
    const fallbackImage = 'https://via.placeholder.com/100x60?text=No+Image';
    const thumbnail = errorThumbnails[item.video_url]
      ? fallbackImage
      : getYouTubeThumbnail(item.video_url);

    return (
      <TouchableOpacity
        style={styles.relatedItem}
        onPress={() => setCurrentUrl(item.video_url)}
      >
        <Image
          source={{ uri: thumbnail }}
          style={styles.thumbnail}
          resizeMode="cover"
          onError={() =>
            setErrorThumbnails((prev) => ({ ...prev, [item.video_url]: true }))
          }
        />
        <View style={{ flex: 1 }}>
          <Text numberOfLines={2} style={styles.relatedTitle}>
            {item.title}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {type === 'video' && videoId && (
        <View style={styles.videoWrapper}>
          <WebView
            originWhitelist={['*']}
            source={{ html: htmlContent }}
            allowsFullscreenVideo
            javaScriptEnabled
            domStorageEnabled
            style={{ flex: 1 }}
          />
        </View>
      )}

      {relatedVideos.length > 1 && (
        <View style={styles.relatedContainer}>
          <Text style={styles.relatedHeader}>Next Videos</Text>
          <FlatList
            data={relatedVideos.filter((v) => v.video_url !== currentUrl)}
            keyExtractor={(item) => item.title}
            renderItem={renderRelatedVideo}
          />
        </View>
      )}
    </View>
  );
};

export default LectureViewerScreen;

const screenWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  videoWrapper: {
    width: '100%',
    height: screenWidth * (9 / 16), // 16:9 ratio
    backgroundColor: 'black',
  },
  relatedContainer: {
    flex: 1,
    padding: 10,
  },
  relatedHeader: {
    marginTop: 15,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#000',
  },
  relatedItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
    padding: 8,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  thumbnail: {
    width: 150,
    height: 80,
    marginRight: 10,
    borderRadius: 6,
    backgroundColor: '#ccc',
  },
  relatedTitle: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
});
