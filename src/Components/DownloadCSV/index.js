import React, {useEffect} from 'react';
import {TouchableOpacity, Image, Text} from 'react-native';

import styles from './DownloadCSV.styles';
import CSV from '../../assets/icons/csv_file.png';
import {downloadFile} from '../../utils/download_file';

const DownloadCSV = ({}) => {
  return (
    <TouchableOpacity
      onPress={() => downloadFile('excel', null, 'Excel1')}
      style={styles.button}>
      <Image source={CSV} style={styles.icon} />
      <Text style={styles.text}>Download CSV</Text>
    </TouchableOpacity>
  );
};

export default DownloadCSV;
