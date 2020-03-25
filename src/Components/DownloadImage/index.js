import React from 'react';
import {TouchableOpacity, Image, Text} from 'react-native';

import styles from './DownloadImage.styles';
import Photo from '../../assets/icons/photo.png';
import {downloadFile} from '../../utils/download_file';

const DownloadImage = ({}) => {
  const downloadImage = async () => {
    downloadFile('image', null, 'Image1');
  };

  return (
    <TouchableOpacity onPress={downloadImage} style={styles.button}>
      <Image source={Photo} style={styles.icon} />
      <Text style={styles.text}>Download Image</Text>
    </TouchableOpacity>
  );
};

export default DownloadImage;
