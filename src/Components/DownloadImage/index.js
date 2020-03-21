import React, {useEffect} from 'react';
import {TouchableOpacity, Image, Text} from 'react-native';

import styles from './DownloadImage.styles';
import Photo from '../../assets/icons/photo.png';

const DownloadImage = ({}) => {
  return (
    <TouchableOpacity style={styles.button}>
      <Image source={Photo} style={styles.icon} />
      <Text style={styles.text}>Download Image</Text>
    </TouchableOpacity>
  );
};

export default DownloadImage;
