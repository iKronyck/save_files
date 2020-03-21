import React from 'react';
import {View, Text, SafeAreaView} from 'react-native';

import styles from './App.styles';
import DownloadImage from '../../Components/DownloadImage';
import DownloadPDF from '../../Components/DownloadPDF';
import DownloadCSV from '../../Components/DownloadCSV';

const App = () => {
  return (
    <SafeAreaView style={styles.app}>
      <View style={styles.container}>
        <DownloadImage />
        <DownloadPDF />
        <DownloadCSV />
      </View>
    </SafeAreaView>
  );
};

export default App;
