import {StyleSheet} from 'react-native';

import {colors} from '../../styles/colors';

export default StyleSheet.create({
  button: {
    flexDirection: 'row',
    backgroundColor: colors.csvButton,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
    padding: 10,
    width: 220,
  },
  icon: {
    height: 30,
    width: 30,
    tintColor: colors.white,
  },
  text: {
    paddingLeft: 5,
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 18,
  },
});
