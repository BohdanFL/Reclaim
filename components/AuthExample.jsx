import React, {useState} from 'react';
import {View, TextInput, Button, Text} from 'react-native';
import auth from '@react-native-firebase/auth';

const AuthExample = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);

  const signUp = async () => {
    try {
      const result = await auth().createUserWithEmailAndPassword(
        email,
        password,
      );
      setUser(result.user);
    } catch (e) {
      console.error(e);
    }
  };

  const login = async () => {
    try {
      const result = await auth().signInWithEmailAndPassword(email, password);
      setUser(result.user);
    } catch (e) {
      console.error(e);
    }
  };

  const logout = async () => {
    await auth().signOut();
    setUser(null);
  };

  return (
    <View>
      {user ? (
        <>
          <Text>Welcome, {user.email}</Text>
          <Button title="Logout" onPress={logout} />
        </>
      ) : (
        <>
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <Button title="Sign Up" onPress={signUp} />
          <Button title="Login" onPress={login} />
        </>
      )}
    </View>
  );
};

export default AuthExample;
