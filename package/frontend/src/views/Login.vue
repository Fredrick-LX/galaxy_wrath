<template>
  <div class="login-page">
    <StarBackground />
    
    <div class="login-container">
      <div class="login-box">
        <h1 class="game-title">星河之怒</h1>
        <p class="game-subtitle">Galaxy Wrath</p>
        
        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label for="email">邮箱</label>
            <input
              id="email"
              v-model="formData.email"
              type="email"
              placeholder="请输入邮箱"
              required
            />
          </div>
          
          <div class="form-group">
            <label for="password">密码</label>
            <input
              id="password"
              v-model="formData.password"
              type="password"
              placeholder="请输入密码"
              required
            />
          </div>
          
          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>
          
          <button type="submit" class="btn-primary" :disabled="loading">
            {{ loading ? '登录中...' : '登录' }}
          </button>
        </form>
        
        <div class="login-links">
          <router-link to="/register" class="link">注册账号</router-link>
          <span class="separator">|</span>
          <router-link to="/reset-password" class="link">找回密码</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/user';
import { login } from '../services/auth';
import StarBackground from '../components/StarBackground.vue';

const router = useRouter();
const userStore = useUserStore();

// 表单数据
const formData = ref({
  email: '',
  password: ''
});

const loading = ref(false);
const errorMessage = ref('');

/**
 * 处理登录
 */
async function handleLogin() {
  errorMessage.value = '';
  loading.value = true;
  
  try {
    const response = await login(formData.value);
    
    if (response.success && response.token && response.user) {
      // 保存用户信息
      userStore.setUser(response.user, response.token);
      
      // 跳转到宇宙界面
      router.push('/universe');
    } else {
      errorMessage.value = response.message;
    }
  } catch (error) {
    errorMessage.value = '登录失败，请稍后重试';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.login-container {
  position: relative;
  z-index: 1;
}

.login-box {
  background: rgba(20, 30, 50, 0.85);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(74, 144, 226, 0.3);
  border-radius: 12px;
  padding: 40px;
  width: 400px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.game-title {
  font-size: 36px;
  font-weight: 700;
  color: #4A90E2;
  text-align: center;
  margin-bottom: 8px;
  text-shadow: 0 0 20px rgba(74, 144, 226, 0.5);
}

.game-subtitle {
  font-size: 16px;
  color: #8FA3C1;
  text-align: center;
  margin-bottom: 30px;
  letter-spacing: 2px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  color: #B0C4DE;
  font-weight: 500;
}

.form-group input {
  padding: 12px 16px;
  background: rgba(10, 20, 40, 0.6);
  border: 1px solid rgba(74, 144, 226, 0.3);
  border-radius: 6px;
  color: #E0E6F0;
  font-size: 14px;
  transition: all 0.3s ease;
}

.form-group input:focus {
  outline: none;
  border-color: #4A90E2;
  box-shadow: 0 0 10px rgba(74, 144, 226, 0.3);
}

.form-group input::placeholder {
  color: #6B7B94;
}

.error-message {
  padding: 10px;
  background: rgba(220, 53, 69, 0.2);
  border: 1px solid rgba(220, 53, 69, 0.4);
  border-radius: 6px;
  color: #FF6B7A;
  font-size: 14px;
  text-align: center;
}

.btn-primary {
  padding: 14px;
  background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 10px;
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #5BA3F5 0%, #4A8BD0 100%);
  box-shadow: 0 4px 15px rgba(74, 144, 226, 0.4);
  transform: translateY(-2px);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-links {
  margin-top: 20px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.login-links .link {
  color: #4A90E2;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.3s ease;
}

.login-links .link:hover {
  color: #5BA3F5;
  text-decoration: underline;
}

.login-links .separator {
  color: #6B7B94;
}
</style>
