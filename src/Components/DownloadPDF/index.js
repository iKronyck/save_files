import React, {useEffect} from 'react';
import {TouchableOpacity, Image, Text} from 'react-native';

import styles from './DownloadPDF.styles';
import PDF from '../../assets/icons/pdf.png';
import {downloadFile} from '../../utils/download_file';

const DownloadPDF = ({}) => {
  return (
    <TouchableOpacity
      onPress={() => downloadFile('pdf', null, 'PDF1')}
      style={styles.button}>
      <Image source={PDF} style={styles.icon} />
      <Text style={styles.text}>Download PDF</Text>
    </TouchableOpacity>
  );
};

export default DownloadPDF;
