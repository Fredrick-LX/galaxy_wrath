<template>
  <div class="register-page">
    <StarBackground />
    
    <div class="register-container">
      <div class="register-box">
        <h1 class="game-title">星河之怒</h1>
        <p class="game-subtitle">注册新账号</p>
        
        <form @submit.prevent="handleRegister" class="register-form">
          <div class="form-group">
            <label for="username">用户名</label>
            <input
              id="username"
              v-model="formData.username"
              type="text"
              placeholder="请输入用户名"
              required
            />
          </div>
          
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
              placeholder="请输入密码（至少6位）"
              required
              minlength="6"
            />
          </div>
          
          <div class="form-group">
            <label for="confirmPassword">确认密码</label>
            <input
              id="confirmPassword"
              v-model="formData.confirmPassword"
              type="password"
              placeholder="请再次输入密码"
              required
            />
          </div>
          
          <div class="form-group verification-group">
            <label for="verificationCode">验证码</label>
            <div class="verification-input">
              <input
                id="verificationCode"
                v-model="formData.verificationCode"
                type="text"
                placeholder="请输入6位验证码"
                required
                maxlength="6"
              />
              <button 
                type="button" 
                class="btn-code"
                @click="handleSendCode"
                :disabled="codeSending || countdown > 0"
              >
                {{ countdown > 0 ? `${countdown}秒后重发` : '发送验证码' }}
              </button>
            </div>
            <p class="hint">测试模式：任意6位数字均可通过验证</p>
          </div>
          
          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>
          
          <div v-if="successMessage" class="success-message">
            {{ successMessage }}
          </div>
          
          <button type="submit" class="btn-primary" :disabled="loading">
            {{ loading ? '注册中...' : '注册' }}
          </button>
        </form>
        
        <div class="register-links">
          <span>已有账号？</span>
          <router-link to="/login" class="link">立即登录</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/user';
import { register, sendVerificationCode } from '../services/auth';
import StarBackground from '../components/StarBackground.vue';

const router = useRouter();
const userStore = useUserStore();

// 表单数据
const formData = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  verificationCode: ''
});

const loading = ref(false);
const codeSending = ref(false);
const countdown = ref(0);
const errorMessage = ref('');
const successMessage = ref('');

/**
 * 发送验证码
 */
async function handleSendCode() {
  if (!formData.value.email) {
    errorMessage.value = '请先输入邮箱';
    return;
  }
  
  errorMessage.value = '';
  successMessage.value = '';
  codeSending.value = true;
  
  try {
    const response = await sendVerificationCode({ email: formData.value.email });
    if (response.success) {
      successMessage.value = response.message;
      // 开始倒计时
      countdown.value = 60;
      const timer = setInterval(() => {
        countdown.value--;
        if (countdown.value <= 0) {
          clearInterval(timer);
        }
      }, 1000);
    } else {
      errorMessage.value = response.message;
    }
  } catch (error) {
    errorMessage.value = '发送验证码失败';
  } finally {
    codeSending.value = false;
  }
}

/**
 * 处理注册
 */
async function handleRegister() {
  errorMessage.value = '';
  successMessage.value = '';
  
  // 验证密码
  if (formData.value.password !== formData.value.confirmPassword) {
    errorMessage.value = '两次输入的密码不一致';
    return;
  }
  
  if (formData.value.password.length < 6) {
    errorMessage.value = '密码长度至少6位';
    return;
  }
  
  if (formData.value.verificationCode.length !== 6) {
    errorMessage.value = '请输入6位验证码';
    return;
  }
  
  loading.value = true;
  
  try {
    const response = await register({
      email: formData.value.email,
      password: formData.value.password,
      username: formData.value.username,
      verificationCode: formData.value.verificationCode
    });
    
    if (response.success && response.token && response.user) {
      successMessage.value = '注册成功！正在跳转...';
      
      // 保存用户信息
      userStore.setUser(response.user, response.token);
      
      // 延迟跳转
      setTimeout(() => {
        router.push('/universe');
      }, 1000);
    } else {
      errorMessage.value = response.message;
    }
  } catch (error) {
    errorMessage.value = '注册失败，请稍后重试';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.register-page {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.register-container {
  position: relative;
  z-index: 1;
}

.register-box {
  background: rgba(20, 30, 50, 0.85);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(74, 144, 226, 0.3);
  border-radius: 12px;
  padding: 40px;
  width: 400px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  max-height: 100vh;
  overflow-y: hidden;
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

.register-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
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

.verification-group .verification-input {
  display: flex;
  gap: 10px;
}

.verification-group .verification-input input {
  flex: 1;
}

.btn-code {
  padding: 12px 16px;
  background: rgba(74, 144, 226, 0.2);
  border: 1px solid rgba(74, 144, 226, 0.4);
  border-radius: 6px;
  color: #4A90E2;
  font-size: 14px;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-code:hover:not(:disabled) {
  background: rgba(74, 144, 226, 0.3);
  border-color: #4A90E2;
}

.btn-code:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.hint {
  font-size: 12px;
  color: #8FA3C1;
  margin: 0;
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

.success-message {
  padding: 10px;
  background: rgba(40, 167, 69, 0.2);
  border: 1px solid rgba(40, 167, 69, 0.4);
  border-radius: 6px;
  color: #5FD98A;
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

.register-links {
  margin-top: 20px;
  text-align: center;
  color: #8FA3C1;
  font-size: 14px;
}

.register-links .link {
  color: #4A90E2;
  text-decoration: none;
  margin-left: 8px;
  transition: color 0.3s ease;
}

.register-links .link:hover {
  color: #5BA3F5;
  text-decoration: underline;
}
</style>